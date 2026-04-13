import axios from 'axios';
import { env } from '$env/dynamic/private';

/** First ASIN block from SP-API competitive pricing (minimal shape for Telegram). */
export type SpApiPricingItem = {
	ASIN: string;
	Product: {
		CompetitivePricing: {
			CompetitivePrices: {
				Price: {
					LandedPrice: { Amount: number };
					Shipping: { Amount: number };
				};
			}[];
			NumberOfOfferListings: { Count: number }[];
		};
		SalesRankings: { Rank: number }[];
	};
};

function privateEnv() {
	return env as Record<string, string | undefined>;
}

function isPricingItem(x: unknown): x is SpApiPricingItem {
	if (!x || typeof x !== 'object' || !('ASIN' in x) || !('Product' in x)) return false;
	return typeof (x as SpApiPricingItem).ASIN === 'string';
}

export type TelegramCredentials = { botToken?: string; chatId?: string };

/** Send formatted alert. Per-field: form value if non-empty, else env `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`. */
export async function sendTelegramAlert(
	item: SpApiPricingItem,
	overrides?: TelegramCredentials
): Promise<{ ok: true } | { ok: false; error: string }> {
	const e = privateEnv();
	const token = (overrides?.botToken?.trim() || e.TELEGRAM_BOT_TOKEN?.trim()) ?? '';
	const chatId = (overrides?.chatId?.trim() || e.TELEGRAM_CHAT_ID?.trim()) ?? '';
	if (!token || !chatId) {
		return {
			ok: false,
			error: 'Provide bot token + chat id in the form or set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.local'
		};
	}

	const priceInfo = item.Product.CompetitivePricing.CompetitivePrices[0].Price;
	const salesRank = item.Product.SalesRankings[0].Rank;
	const offerCount = item.Product.CompetitivePricing.NumberOfOfferListings[0].Count;
	const text = [
		`🚨 *Amazon Alert: ${item.ASIN}*`,
		`💰 *Price:* $${priceInfo.LandedPrice.Amount}`,
		`🚚 *Shipping:* $${priceInfo.Shipping.Amount}`,
		`📉 *Rank:* #${salesRank}`,
		`📊 *Offers:* ${offerCount}`
	].join('\n');

	try {
		await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
			chat_id: chatId,
			text,
			parse_mode: 'Markdown'
		});
		return { ok: true };
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		return { ok: false, error: msg };
	}
}

/** LWA → sandbox pricing only (no Telegram). */
export async function runM1() {
	const e = privateEnv();
	const CREDENTIALS = {
		clientId: e.AMAZON_CLIENT_ID ?? '',
		clientSecret: e.AMAZON_CLIENT_SECRET ?? '',
		refreshToken: e.AMAZON_REFRESH_TOKEN ?? ''
	};

	try {
		const auth = await axios.post('https://api.amazon.com/auth/o2/token', {
			grant_type: 'refresh_token',
			refresh_token: CREDENTIALS.refreshToken,
			client_id: CREDENTIALS.clientId,
			client_secret: CREDENTIALS.clientSecret
		});
		const accessToken = auth.data.access_token;

		const url =
			'https://sandbox.sellingpartnerapi-na.amazon.com/products/pricing/v0/competitivePrice?MarketplaceId=ATVPDKIKX0DER&Asins=B00ZIAODGE&ItemType=Asin';
		const spApi = await axios.get(url, {
			headers: { 'x-amz-access-token': accessToken }
		});

		return { ok: true as const, data: spApi.data };
	} catch {
		return { ok: false as const };
	}
}

export { isPricingItem };
