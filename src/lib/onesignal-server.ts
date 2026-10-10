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

  const basePayload: any = {
    app_id: appId,
    headings: { id: headings, en: headings },
    contents: { id: contents, en: contents },
    url: url || 'https://mis-nur-aziz.vercel.app/spmb/cek-status',
  };

  try {
    if (sendToAll) {
      const payload = { ...basePayload, included_segments: ['Total Subscriptions'] };
      const res = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${restApiKey}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('[OneSignal Broadcast Result]:', JSON.stringify(data));
      return { success: res.ok, data };
    }

    if (tagValue) {
      // 1. Kirim via External ID (OneSignal.login)
      const aliasPayload = {
        ...basePayload,
        include_aliases: { external_id: [tagValue] },
        target_channel: 'push',
      };

      const res1 = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${restApiKey}`,
        },
        body: JSON.stringify(aliasPayload),
      });
      const data1 = await res1.json();
      console.log('[OneSignal Push (External ID) Result]:', JSON.stringify(data1));

      // 2. Kirim juga via Tag Filter (spmb_id)
      const tagPayload = {
        ...basePayload,
        filters: [{ field: 'tag', key: tagKey || 'spmb_id', relation: '=', value: tagValue }],
      };

      const res2 = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${restApiKey}`,
        },
        body: JSON.stringify(tagPayload),
      });
      const data2 = await res2.json();
      console.log('[OneSignal Push (Tag Filter) Result]:', JSON.stringify(data2));

      return {
        success: res1.ok || res2.ok,
        data: { aliasResult: data1, tagResult: data2 },
      };
    }

    return { error: 'No target specified' };
  } catch (err: any) {
    console.error('[OneSignal Server Error]:', err);
    return { error: err.message };
  }
}
