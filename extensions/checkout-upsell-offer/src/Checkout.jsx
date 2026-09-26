import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useState, useEffect, useMemo} from 'preact/hooks';

export default async () => {
  render(<UpsellOfferExtension />, document.body);
};

const SAMPLE_IMAGE = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80';

// Fallback complementary recommendations (strictly in-stock) if store has limited catalog items
const FALLBACK_PRODUCTS = [
  {
    productId: '',
    variantId: '',
    title: 'Luxury Gift Box & Greeting Card',
    subtitle: 'Hand-packed complementary packaging',
    price: '$4.99',
    imageUrl: SAMPLE_IMAGE,
    availableForSale: true,
  },
  {
    productId: '',
    variantId: '',
    title: 'Priority Handling & Care',
    subtitle: 'Expedited packing and transit protection',
    price: '$2.99',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80',
    availableForSale: true,
  },
];

// Helper: Check if a product or ANY of its variants/titles matches items in the buyer's cart/order
function isProductAlreadyInCart(prod, cartProductIds, cartVariantIds, cartTitles) {
  if (!prod) return true;

  // 1. Direct parent product ID match (both full GID and numeric ID)
  if (prod.id) {
    if (cartProductIds.has(prod.id)) return true;
    const numericId = String(prod.id).replace(/\D/g, '');
    if (numericId && cartProductIds.has(numericId)) return true;
  }
  if (prod.productId) {
    if (cartProductIds.has(prod.productId)) return true;
    const numericId = String(prod.productId).replace(/\D/g, '');
    if (numericId && cartProductIds.has(numericId)) return true;
  }

  // 2. Check product title (case-insensitive) to prevent any name match
  if (prod.title && cartTitles) {
    const lowerTitle = prod.title.trim().toLowerCase();
    if (cartTitles.has(lowerTitle)) return true;
  }

  // 3. Check if ANY variant belonging to this product is in the cart
  const variants = prod.variants?.nodes || [];
  for (const variant of variants) {
    if (!variant?.id) continue;
    if (cartVariantIds.has(variant.id)) return true;
    const numericVariantId = String(variant.id).replace(/\D/g, '');
    if (numericVariantId && cartVariantIds.has(numericVariantId)) return true;
  }

  return false;
}

// Helper: Find an in-stock alternative product from store catalog that is 100% NOT in the cart
function findAlternativeProduct(products, cartProductIds, cartVariantIds, cartTitles) {
  if (Array.isArray(products) && products.length > 0) {
    for (const prod of products) {
      // STRICT CHECK: Skip any product that is out of stock / unavailable
      if (prod.availableForSale === false) continue;

      // Skip any product that is already in the cart
      if (isProductAlreadyInCart(prod, cartProductIds, cartVariantIds, cartTitles)) continue;

      const variants = prod.variants?.nodes || [];

      // STRICT CHECK: Only select an in-stock variant (availableForSale === true) that is not in cart
      const inStockVariant = variants.find(
        (v) => v.availableForSale === true && !cartVariantIds.has(v.id)
      );

      if (inStockVariant) {
        const priceText = inStockVariant.price?.amount
          ? (inStockVariant.price.currencyCode
              ? `${inStockVariant.price.currencyCode} ${inStockVariant.price.amount}`
              : `$${inStockVariant.price.amount}`)
          : '';

        return {
          productId: prod.id,
          variantId: inStockVariant.id,
          title: prod.title,
          subtitle: inStockVariant.title && inStockVariant.title !== 'Default Title' ? inStockVariant.title : '',
          price: priceText,
          imageUrl: inStockVariant.image?.url || prod.featuredImage?.url || SAMPLE_IMAGE,
          availableForSale: true,
        };
      }
    }
  }

  // Fallback: If no in-stock store product is available (or all are in the cart),
  // pick an in-stock complementary add-on that is not in the cart
  for (const fallback of FALLBACK_PRODUCTS) {
    if (!cartTitles.has(fallback.title.toLowerCase()) && fallback.availableForSale === true) {
      return fallback;
    }
  }

  return FALLBACK_PRODUCTS[0];
}

function UpsellOfferExtension() {
  const settings = shopify.settings?.value || {};
  const currentLines = shopify.lines?.value || [];

  const [catalogProducts, setCatalogProducts] = useState(null);
  const [featuredVariantData, setFeaturedVariantData] = useState(null);
  const [addedProduct, setAddedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // If merchant turned off the offer in checkout settings, do not render
  if (settings.show_offer === false) {
    return null;
  }

  const heading = settings.offer_heading || shopify.i18n.translate('defaultHeading');
  const subheading = settings.offer_subheading || shopify.i18n.translate('defaultSubheading');
  const badgeText = settings.offer_badge_text || shopify.i18n.translate('defaultBadge');

  // Extract all variant IDs, parent product IDs, and titles currently in the cart
  const { cartVariantIds, cartProductIds, cartTitles } = useMemo(() => {
    const vIds = new Set();
    const pIds = new Set();
    const titles = new Set();

    const lines = Array.isArray(currentLines) ? currentLines : [];
    for (const line of lines) {
      if (line?.merchandise?.id) {
        vIds.add(line.merchandise.id);
        const numericId = String(line.merchandise.id).replace(/\D/g, '');
        if (numericId) vIds.add(numericId);
      }
      if (line?.merchandise?.product?.id) {
        pIds.add(line.merchandise.product.id);
        const numericId = String(line.merchandise.product.id).replace(/\D/g, '');
        if (numericId) pIds.add(numericId);
      }
      if (line?.merchandise?.product?.title) {
        titles.add(line.merchandise.product.title.trim().toLowerCase());
      }
    }

    return {
      cartVariantIds: vIds,
      cartProductIds: pIds,
      cartTitles: titles,
    };
  }, [currentLines]);

  // Fetch store catalog products and featured variant on mount or when settings change
  useEffect(() => {
    let isMounted = true;
    const featuredVariant = typeof settings.featured_variant === 'string'
      ? settings.featured_variant.trim()
      : '';

    // If merchant configured a featured variant, fetch its details
    if (featuredVariant) {
      shopify
        .query(
          `query getVariant($id: ID!) {
            node(id: $id) {
              ... on ProductVariant {
                id
                title
                availableForSale
                price {
                  amount
                  currencyCode
                }
                image {
                  url
                  altText
                }
                product {
                  id
                  title
                  availableForSale
                  featuredImage {
                    url
                    altText
                  }
                }
              }
            }
          }`,
          { variables: { id: featuredVariant } }
        )
        .then((res) => {
          if (!isMounted) return;
          const variant = res.data?.node;
          // STRICT STOCK CHECK: variant and product MUST be availableForSale
          if (variant && variant.availableForSale === true && variant.product?.availableForSale !== false) {
            const priceText = variant.price?.amount
              ? (variant.price.currencyCode ? `${variant.price.currencyCode} ${variant.price.amount}` : `$${variant.price.amount}`)
              : '';
            setFeaturedVariantData({
              productId: variant.product?.id,
              variantId: variant.id,
              title: variant.product?.title || variant.title,
              subtitle: variant.title !== 'Default Title' ? variant.title : '',
              price: priceText,
              imageUrl: variant.image?.url || variant.product?.featuredImage?.url || SAMPLE_IMAGE,
              availableForSale: true,
            });
          } else {
            // Out of stock featured variant: do not show
            setFeaturedVariantData(null);
          }
        })
        .catch(() => {
          if (isMounted) setFeaturedVariantData(null);
        });
    } else {
      setFeaturedVariantData(null);
    }

    // Always fetch catalog products for recommendations
    shopify
      .query(
        `query getRecommendedProducts {
          products(first: 20) {
            nodes {
              id
              title
              availableForSale
              featuredImage {
                url
                altText
              }
              variants(first: 10) {
                nodes {
                  id
                  title
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                  image {
                    url
                    altText
                  }
                }
              }
            }
          }
        }`
      )
      .then((res) => {
        if (!isMounted) return;
        const products = res.data?.products?.nodes || [];
        setCatalogProducts(products);
      })
      .catch(() => {
        if (isMounted) setCatalogProducts([]);
      });

    return () => {
      isMounted = false;
    };
  }, [settings.featured_variant]);

  // Dynamically determine which product to recommend:
  // 1. If an item was added in this session, keep it displayed so user can checkout smoothly
  // 2. Otherwise find an in-stock product that does not match what's in the cart
  const product = useMemo(() => {
    // KEEP THE ADDED PRODUCT DISPLAYED: Do not switch to another product after adding!
    if (addedProduct) {
      return addedProduct;
    }

    // 1. If merchant specified an in-stock featured variant that is NOT in the cart
    if (featuredVariantData) {
      const isFeaturedInCart = isProductAlreadyInCart(
        featuredVariantData,
        cartProductIds,
        cartVariantIds,
        cartTitles
      );

      if (!isFeaturedInCart && featuredVariantData.availableForSale === true) {
        return featuredVariantData;
      }
    }

    // 2. Recommend an in-stock alternative product from the store catalog
    if (catalogProducts) {
      return findAlternativeProduct(catalogProducts, cartProductIds, cartVariantIds, cartTitles);
    }

    // 3. Fallback while catalog query is in flight
    for (const fallback of FALLBACK_PRODUCTS) {
      if (!cartTitles.has(fallback.title.toLowerCase()) && fallback.availableForSale === true) {
        return fallback;
      }
    }

    return FALLBACK_PRODUCTS[0];
  }, [addedProduct, featuredVariantData, catalogProducts, cartProductIds, cartVariantIds, cartTitles]);

  if (!product) {
    return null;
  }

  const isAdded = Boolean(addedProduct);

  const handleAddToCart = async () => {
    if (!product || loading || isAdded) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    // If it's a real Shopify catalog variant:
    if (product.variantId && typeof shopify.applyCartLinesChange === 'function') {
      try {
        const result = await shopify.applyCartLinesChange({
          type: 'addCartLine',
          merchandiseId: product.variantId,
          quantity: 1,
        });

        if (result.type === 'error') {
          setErrorMessage(result.message || 'Could not add to order.');
        } else {
          // Lock this product as added and keep it displayed so user can place the order
          setAddedProduct(product);
          setSuccessMessage(`Added "${product.title}" to your order!`);
        }
      } catch (err) {
        setErrorMessage('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    } else {
      // In preview/sample fallback mode
      setAddedProduct(product);
      setSuccessMessage(`Added "${product.title}" to your order!`);
      setLoading(false);
    }
  };

  return (
    <s-box padding="base" border="base" borderRadius="base">
      <s-stack direction="block" gap="base">
        {/* Header row with heading and badge */}
        <s-stack direction="inline" justifyContent="space-between" alignItems="center">
          <s-stack direction="block" gap="extra-tight">
            <s-heading level="3">{heading}</s-heading>
            {subheading ? <s-text tone="subdued">{subheading}</s-text> : null}
          </s-stack>
          {badgeText ? <s-badge tone="success">{badgeText}</s-badge> : null}
        </s-stack>

        {errorMessage ? (
          <s-banner tone="critical" dismissible onDismiss={() => setErrorMessage('')}>
            {errorMessage}
          </s-banner>
        ) : null}

        {successMessage ? (
          <s-banner tone="success" dismissible onDismiss={() => setSuccessMessage('')}>
            {successMessage}
          </s-banner>
        ) : null}

        <s-divider></s-divider>

        {/* Product offer row */}
        <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
          <s-stack direction="inline" gap="base" alignItems="center">
            <s-product-thumbnail
              src={product.imageUrl}
              alt={product.title}
              size="base"
            />
            <s-stack direction="block" gap="extra-tight">
              <s-text type="strong">{product.title}</s-text>
              {product.subtitle ? <s-text tone="subdued">{product.subtitle}</s-text> : null}
              <s-text tone="base">{product.price}</s-text>
            </s-stack>
          </s-stack>

          <s-button
            variant={isAdded ? 'secondary' : 'primary'}
            disabled={isAdded || loading}
            loading={loading}
            onClick={handleAddToCart}
          >
            {isAdded
              ? shopify.i18n.translate('added')
              : (loading ? shopify.i18n.translate('adding') : shopify.i18n.translate('addToOrder'))}
          </s-button>
        </s-stack>
      </s-stack>
    </s-box>
  );
}
