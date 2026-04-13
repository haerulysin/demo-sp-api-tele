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

async function sendTelegram(item: SpApiPricingItem): Promise<boolean> {
	const token = privateEnv().TELEGRAM_BOT_TOKEN;
	const chatId = privateEnv().TELEGRAM_CHAT_ID;
	if (!token?.trim() || !chatId?.trim()) return false;

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
		return true;
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		console.error('[m1] Telegram:', msg);
		return false;
	}
}

/** MVP: LWA → sandbox pricing → optional Telegram (if env set). */
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

		const payload = spApi.data?.payload;
		let telegramSent = false;
		if (Array.isArray(payload)) {
			for (const item of payload) {
				if (item && typeof item === 'object' && 'ASIN' in item) {
					const sent = await sendTelegram(item as SpApiPricingItem);
					telegramSent = telegramSent || sent; // any successful send sets to true
				}
			}
		}

		return { ok: true as const, data: spApi.data, telegramSent };
	} catch {
		return { ok: false as const };
	}
}
