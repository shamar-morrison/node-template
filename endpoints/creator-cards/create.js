const { createHandler } = require('@app-core/server');
const createCreatorCardService = require('@app/services/creator-cards/create-creator-card');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards',
  method: 'post',
  middlewares: [],

  async handler(rc, helpers) {
    const response = await createCreatorCardService(rc.body);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CARD_CREATED,
      data: response,
    };
  },
});
