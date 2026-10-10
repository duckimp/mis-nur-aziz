/**
 * Server-side OneSignal Push Notification Dispatcher
 */
export async function sendPushNotification({
  headings,
  contents,
  url,
  tagKey,
  tagValue,
  sendToAll = false,
}: {
  headings: string;
  contents: string;
  url?: string;
  tagKey?: string;
  tagValue?: string;
  sendToAll?: boolean;
}) {
  const appId = import.meta.env.PUBLIC_ONESIGNAL_APP_ID || '9a1b504d-2ba5-4f80-b49f-2592262f76e0';
  const restApiKey = import.meta.env.ONESIGNAL_REST_API_KEY;

  if (!restApiKey) {
    console.warn('[OneSignal Server] ONESIGNAL_REST_API_KEY not found in environment');
    return { error: 'ONESIGNAL_REST_API_KEY not configured' };
  }

  const payload: any = {
    app_id: appId,
    headings: { id: headings, en: headings },
    contents: { id: contents, en: contents },
    url: url || 'https://mis-nur-aziz.vercel.app/spmb/cek-status',
  };

  if (sendToAll) {
    payload.included_segments = ['Total Subscriptions'];
  } else if (tagKey && tagValue) {
    payload.filters = [
      { field: 'tag', key: tagKey, relation: '=', value: tagValue }
    ];
  } else {
    payload.included_segments = ['Total Subscriptions'];
  }

  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return { success: res.ok, data };
  } catch (err: any) {
    console.error('[OneSignal Server Error]:', err);
    return { error: err.message };
  }
}
