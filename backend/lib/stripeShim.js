export default class Stripe {
  constructor() {}
  get paymentIntents() {
    return {
      create: async () => ({ id: 'pi_fake', client_secret: 'fake_client_secret' })
    };
  }
  get checkout() {
    return { sessions: { create: async () => ({ id: 'sess_fake', url: '/' }) } };
  }
}
