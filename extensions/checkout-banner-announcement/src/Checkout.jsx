import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useState} from 'preact/hooks';

// 1. Export the checkout extension entry point
export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  // 2. Track dismissal state when banner is dismissible
  const [isDismissed, setIsDismissed] = useState(false);

  // 3. Read merchant settings configured via Shopify Checkout Editor
  const settings = shopify.settings?.value || {};

  // If the merchant disabled the banner or the customer dismissed it, hide it
  if (settings.show_banner === false || isDismissed) {
    return null;
  }

  // 4. Resolve banner content with locale fallbacks
  const heading = settings.banner_title || shopify.i18n.translate('defaultTitle');
  const description = settings.banner_description || shopify.i18n.translate('defaultDescription');

  // Allowed tones for Polaris s-banner: 'info', 'success', 'warning', 'critical'
  const validTones = ['info', 'success', 'warning', 'critical'];
  const configuredTone = typeof settings.banner_tone === 'string'
    ? settings.banner_tone.trim().toLowerCase()
    : '';
  const tone = validTones.includes(configuredTone) ? configuredTone : 'info';

  const isDismissible = Boolean(settings.banner_dismissible);
  const isCollapsible = Boolean(settings.banner_collapsible);

  const linkUrl = typeof settings.link_url === 'string' ? settings.link_url.trim() : '';
  const linkText = settings.link_text || (linkUrl ? shopify.i18n.translate('defaultLinkText') : '');

  // 5. Render Polaris Web Components
  return (
    <s-banner
      heading={heading}
      tone={tone}
      dismissible={isDismissible}
      collapsible={isCollapsible}
      onDismiss={() => setIsDismissed(true)}
    >
      <s-stack direction="block" gap="small">
        <s-paragraph>{description}</s-paragraph>
        {linkUrl && linkText ? (
          <s-link href={linkUrl}>
            {linkText}
          </s-link>
        ) : null}
      </s-stack>
    </s-banner>
  );
}