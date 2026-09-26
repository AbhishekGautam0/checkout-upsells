import '@shopify/ui-extensions/preact';
import { render } from 'preact';

export default async () => {
  render(<ImageBannerExtension />, document.body);
};

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80';

/**
 * ============================================================================
 * 📱 MOBILE BANNER COMPONENT
 * Manage and customize your mobile view banner here.
 * Visible on screens/containers under 749px (hidden on desktop).
 * ============================================================================
 */
function MobileBannerImage({
  imageUrl,
  aspectRatio = '16/9',
  borderRadius = 'base',
  altText = '',
  linkUrl = '',
}) {
  const imageElement = (
    <s-image
      src={imageUrl}
      alt={altText}
      aspectRatio={aspectRatio}
      borderRadius={borderRadius}
      inlineSize="fill"
    />
  );

  return (
    <s-box
      display="@container (inline-size <= 749px) auto, none"
      inlineSize="fill"
    >
      {linkUrl ? (
        <s-clickable href={linkUrl} inlineSize="fill">
          {imageElement}
        </s-clickable>
      ) : (
        imageElement
      )}
    </s-box>
  );
}

/**
 * ============================================================================
 * 💻 DESKTOP BANNER COMPONENT
 * Manage and customize your desktop view banner here.
 * Visible on screens/containers above 749px (hidden on mobile).
 * When isAlwaysVisible is true, it shows across all screens (fallback mode).
 * ============================================================================
 */
function DesktopBannerImage({
  imageUrl,
  aspectRatio = '3/1',
  borderRadius = 'base',
  altText = '',
  linkUrl = '',
  isAlwaysVisible = false,
}) {
  const imageElement = (
    <s-image
      src={imageUrl}
      alt={altText}
      aspectRatio={aspectRatio}
      borderRadius={borderRadius}
      inlineSize="fill"
    />
  );

  return (
    <s-box
      display={isAlwaysVisible ? undefined : '@container (inline-size <= 749px) none, auto'}
      inlineSize="fill"
    >
      {linkUrl ? (
        <s-clickable href={linkUrl} inlineSize="fill">
          {imageElement}
        </s-clickable>
      ) : (
        imageElement
      )}
    </s-box>
  );
}

/**
 * ============================================================================
 * 🚀 MAIN EXTENSION COMPONENT
 * Manages customizer settings and mounts mobile/desktop banner components.
 * ============================================================================
 */
function ImageBannerExtension() {
  const settings = shopify.settings?.value || {};

  // If the merchant turned off the banner in settings, do not display
  if (settings.show_banner === false) {
    return null;
  }

  const hasCustomDesktop = typeof settings.desktop_image_url === 'string' && settings.desktop_image_url.trim().length > 0;
  const hasCustomMobile = typeof settings.mobile_image_url === 'string' && settings.mobile_image_url.trim().length > 0;

  const desktopImage = hasCustomDesktop ? settings.desktop_image_url.trim() : DEFAULT_BANNER;
  // Fall back to desktop image if mobile image is not configured
  const mobileImage = hasCustomMobile ? settings.mobile_image_url.trim() : desktopImage;

  const altText = settings.alt_text || shopify.i18n.translate('defaultAlt');
  const desktopAspectRatio = settings.aspect_ratio || '3/1';
  const mobileAspectRatio = settings.aspect_ratio || '16/9';

  const validRadii = ['none', 'small', 'base', 'large'];
  const configuredRadius = typeof settings.border_radius === 'string' ? settings.border_radius.toLowerCase() : '';
  const borderRadius = validRadii.includes(configuredRadius) ? configuredRadius : 'base';

  const linkUrl = typeof settings.link_url === 'string' ? settings.link_url.trim() : '';
  const title = settings.banner_title || '';
  const caption = settings.banner_caption || '';

  return (
    <s-box padding="none" inlineSize="fill">
      <s-stack direction="block" gap="tight" inlineSize="fill">
        {hasCustomMobile ? (
          /* Container query wrapper to manage mobile vs desktop view switching */
          <s-query-container>
            {/* 📱 Mobile Component (under 749px) */}
            <MobileBannerImage
              imageUrl={mobileImage}
              aspectRatio={mobileAspectRatio}
              borderRadius={borderRadius}
              altText={altText}
              linkUrl={linkUrl}
            />

            {/* 💻 Desktop Component (above 749px) */}
            <DesktopBannerImage
              imageUrl={desktopImage}
              aspectRatio={desktopAspectRatio}
              borderRadius={borderRadius}
              altText={altText}
              linkUrl={linkUrl}
              isAlwaysVisible={false}
            />
          </s-query-container>
        ) : (
          /* Fallback: When no mobile image is configured, desktop component renders everywhere */
          <DesktopBannerImage
            imageUrl={desktopImage}
            aspectRatio={desktopAspectRatio}
            borderRadius={borderRadius}
            altText={altText}
            linkUrl={linkUrl}
            isAlwaysVisible={true}
          />
        )}

        {/* Optional Title & Description */}
        {title || caption ? (
          <s-stack direction="block" gap="extra-tight">
            {title ? <s-heading level="3">{title}</s-heading> : null}
            {caption ? <s-paragraph>{caption}</s-paragraph> : null}
          </s-stack>
        ) : null}
      </s-stack>
    </s-box>
  );
}
