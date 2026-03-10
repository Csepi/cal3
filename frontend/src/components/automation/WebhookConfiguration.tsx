import React, { useState } from 'react';
import { BASE_URL } from '../../config/apiConfig';
import { TriggerType } from '../../types/Automation';

import { tStatic } from '../../i18n';

interface WebhookConfigurationProps {
  ruleId: number | null;
  triggerType: TriggerType | null;
  webhookToken: string | null;
  onRegenerateToken?: () => Promise<string>;
}

export const WebhookConfiguration: React.FC<WebhookConfigurationProps> = ({
  ruleId,
  triggerType,
  webhookToken,
  onRegenerateToken,
}) => {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Only show for webhook triggers
  if (triggerType !== TriggerType.WEBHOOK_INCOMING) {
    return null;
  }

  // Get the webhook URL
  const getWebhookUrl = () => {
    if (!webhookToken) return '';
    const baseUrl = BASE_URL;
    return `${baseUrl}/api/automation/webhook/${webhookToken}`;
  };

  const webhookUrl = getWebhookUrl();

  const handleCopyUrl = async () => {
    if (!webhookUrl) return;

    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleRegenerateToken = async () => {
    if (!onRegenerateToken || !ruleId) return;

    if (!confirm(tStatic('common:auto.frontend.ka42a6e9442a1'))) {
      return;
    }

    try {
      setRegenerating(true);
      await onRegenerateToken();
    } catch (error) {
      console.error('Failed to regenerate token:', error);
      alert(tStatic('common:auto.frontend.k0582e2e2bf0a'));
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyPayloadExample = async () => {
    const example = JSON.stringify({
      customer_id: '12345',
      order_status: 'completed',
      amount: 150.00,
      metadata: {
        source: 'web',
        priority: 'high'
      }
    }, null, 2);

    try {
      await navigator.clipboard.writeText(example);
      alert(tStatic('common:auto.frontend.k1c64f8fcbf5f'));
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
        <span className="text-lg">🌐</span>
        {tStatic('common:auto.frontend.k8a1fd526c14f')}</h4>

      {!ruleId ? (
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="mb-2">{tStatic('common:auto.frontend.k3952fd7ef892')}</p>
          <p className="text-xs">
            {tStatic('common:auto.frontend.k220dc121d4fd')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {/* Webhook URL */}
            <div>
              <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                {tStatic('common:auto.frontend.kfa7517b6b6b0')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-md text-gray-900 dark:text-gray-100 font-mono"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <span>✓</span>
                      <span>{tStatic('common:auto.frontend.kb7c3ca0ee379')}</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>{tStatic('common:auto.frontend.kaf74f7c5362a')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Regenerate Token Button */}
            {onRegenerateToken && (
              <div>
                <button
                  onClick={handleRegenerateToken}
                  disabled={regenerating}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors flex items-center gap-2"
                >
                  <span>🔄</span>
                  <span>{regenerating ? 'Regenerating...' : 'Regenerate Token'}</span>
                </button>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {tStatic('common:auto.frontend.kcd5943ef1c93')}</p>
              </div>
            )}

            {/* Usage Instructions */}
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-md">
              <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
                {tStatic('common:auto.frontend.k962248bc7070')}</h5>
              <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>{tStatic('common:auto.frontend.k9a6933728c0d')}</li>
                <li>{tStatic('common:auto.frontend.kf87ed23f1f42')}</li>
                <li>{tStatic('common:auto.frontend.kb69290101ab5')}</li>
                <li>{tStatic('common:auto.frontend.k9371234e38a3')}<code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{tStatic('common:auto.frontend.kab3e505b6a6e')}</code>)</li>
                <li>{tStatic('common:auto.frontend.k5e717181416b')}</li>
              </ol>
            </div>

            {/* Example Payload */}
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                  {tStatic('common:auto.frontend.kc4479296fc39')}</h5>
                <button
                  onClick={handleCopyPayloadExample}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {tStatic('common:auto.frontend.ke33f55244c62')}</button>
              </div>
              <pre className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 p-2 rounded overflow-x-auto">
{`{
  "customer_id": "12345",
  "order_status": "completed",
  "amount": 150.00,
  "metadata": {
    "source": "web",
    "priority": "high"
  }
}`}
              </pre>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                {tStatic('common:auto.frontend.kcf21ea8c08e2')}<code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{tStatic('common:auto.frontend.kd63f67049140')}</code>,
                <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded ml-1">{tStatic('common:auto.frontend.kb1234dd65850')}</code>
              </p>
            </div>

            {/* Smart Values Info */}
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
              <h5 className="text-xs font-semibold text-green-900 dark:text-green-100 mb-2">
                {tStatic('common:auto.frontend.k833f68e4f84d')}</h5>
              <p className="text-xs text-green-700 dark:text-green-300">
                {tStatic('common:auto.frontend.kddd0b1829c50')}<code className="bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">{tStatic('common:auto.frontend.kd63f67049140')}</code>).
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
