const { createHandler } = require('@app-core/server');
const deleteCreatorCardService = require('@app/services/creator-cards/delete-creator-card');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],

  async handler(rc, helpers) {
    const response = await deleteCreatorCardService({
      slug: rc.params.slug,
      creator_reference: rc.body.creator_reference,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CARD_DELETED,
      data: response,
    };
  },
});
