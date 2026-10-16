export const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    quota: 10,
    pagesPerPdf: 10,
    price: {
      amount: 0,
      priceIds: {
        test: '',
        production: '',
      },
      yearlyPriceIds: {
        test: '',
        production: '',
      },
      legacyPriceIds: [],
    },
  },
  {
    name: 'Pro',
    slug: 'pro',
    quota: 70,
    pagesPerPdf: 35,
    price: {
    amount: 5,
    yearlyAmount: 45,
    priceIds: {
      test: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
      production: process.env.STRIPE_PRO_MONTHLY_PRICE_ID_PRODUCTION ?? '',
    },
    yearlyPriceIds: {
      test: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? '',
      production: process.env.STRIPE_PRO_YEARLY_PRICE_ID_PRODUCTION ?? '',
    },
    legacyPriceIds: ['price_1RfOnd2ferafg422IS053HhW'],
    },
  },
]