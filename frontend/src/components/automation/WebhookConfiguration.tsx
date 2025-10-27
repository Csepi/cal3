import React, { useState } from 'react';
import { TriggerType } from '../../types/Automation';

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
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
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

    if (!confirm('Are you sure you want to regenerate the webhook token? The old URL will stop working.')) {
      return;
    }

    try {
      setRegenerating(true);
      await onRegenerateToken();
    } catch (error) {
      console.error('Failed to regenerate token:', error);
      alert('Failed to regenerate token. Please try again.');
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
      alert('Payload example copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
        <span className="text-lg">🌐</span>
        Webhook Configuration
      </h4>

      {!ruleId ? (
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="mb-2">Save this rule to generate a webhook URL.</p>
          <p className="text-xs">
            Once saved, you'll receive a unique webhook URL that external systems can use to trigger this automation.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {/* Webhook URL */}
            <div>
              <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                Webhook URL
              </label>
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
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Copy</span>
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
                  Warning: Regenerating will invalidate the current webhook URL
                </p>
              </div>
            )}

            {/* Usage Instructions */}
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-md">
              <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
                How to Use
              </h5>
              <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Copy the webhook URL above</li>
                <li>Configure your external system to send POST requests to this URL</li>
                <li>Send JSON data in the request body</li>
                <li>Use conditions to check webhook data fields (e.g., <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">webhook.data.status</code>)</li>
                <li>Define actions to execute when conditions match</li>
              </ol>
            </div>

            {/* Example Payload */}
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                  Example Payload
                </h5>
                <button
                  onClick={handleCopyPayloadExample}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Copy Example
                </button>
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
                Access fields using dot notation: <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">webhook.data.customer_id</code>,
                <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded ml-1">webhook.data.metadata.priority</code>
              </p>
            </div>

            {/* Smart Values Info */}
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
              <h5 className="text-xs font-semibold text-green-900 dark:text-green-100 mb-2">
                💡 Using Smart Values
              </h5>
              <p className="text-xs text-green-700 dark:text-green-300">
                Webhook data is automatically available as smart values in conditions.
                Select "Webhook Data" as the condition field, then specify the JSON path
                in the value (e.g., <code className="bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">webhook.data.customer_id</code>).
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
