const validator = require('@app-core/validator');
const { appLogger } = require('@app-core/logger');
const CreatorCard = require('@app/repository/creator-cards');
const { CreatorCardMessages } = require('@app/messages');
const serializeCreatorCard = require('./serializer');
const throwBusinessError = require('./business-error');

const SPEC = `root {
  slug               string<trim|minLength:1>
  creator_reference  string<length:20>
}`;

const parsedSpec = validator.parse(SPEC);

async function deleteCreatorCard(serviceData) {
  const data = validator.validate(serviceData, parsedSpec);

  try {
    const card = await CreatorCard.findOne({ query: { slug: data.slug, deleted: null } });

    if (!card) {
      throwBusinessError(CreatorCardMessages.CARD_NOT_FOUND, 'NF01');
    }

    const deletedAt = Date.now();
    await CreatorCard.updateOne({
      query: { slug: data.slug, deleted: null },
      updateValues: {
        deleted: deletedAt,
        updated: deletedAt,
      },
    });

    return serializeCreatorCard(card, {
      includeAccessCode: true,
      deletedAt,
    });
  } catch (error) {
    appLogger.errorX(error, 'delete-creator-card-error');
    throw error;
  }
}

module.exports = deleteCreatorCard;
