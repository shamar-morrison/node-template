const { createHandler } = require('@app-core/server');
const getCreatorCardService = require('@app/services/creator-cards/get-creator-card');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],

  async handler(rc, helpers) {
    const response = await getCreatorCardService({
      slug: rc.params.slug,
      access_code: rc.query.access_code || undefined,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CARD_RETRIEVED,
      data: response,
    };
  },
});
