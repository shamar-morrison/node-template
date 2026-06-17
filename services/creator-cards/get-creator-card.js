const validator = require('@app-core/validator');
const { appLogger } = require('@app-core/logger');
const CreatorCard = require('@app/repository/creator-cards');
const { CreatorCardMessages } = require('@app/messages');
const serializeCreatorCard = require('./serializer');
const throwBusinessError = require('./business-error');

const SPEC = `root {
  slug         string<trim|minLength:1>
  access_code? string
}`;

const parsedSpec = validator.parse(SPEC);

async function getCreatorCard(serviceData) {
  const data = validator.validate(serviceData, parsedSpec);

  try {
    const card = await CreatorCard.findOne({ query: { slug: data.slug, deleted: null } });

    if (!card) {
      throwBusinessError(CreatorCardMessages.CARD_NOT_FOUND, 'NF01');
    }

    if (card.status === 'draft') {
      throwBusinessError(CreatorCardMessages.CARD_IS_DRAFT, 'NF02');
    }

    if (card.access_type === 'private' && !data.access_code) {
      throwBusinessError(CreatorCardMessages.ACCESS_CODE_REQUIRED, 'AC03');
    }

    if (card.access_type === 'private' && card.access_code !== data.access_code) {
      throwBusinessError(CreatorCardMessages.INVALID_ACCESS_CODE, 'AC04');
    }

    return serializeCreatorCard(card);
  } catch (error) {
    appLogger.errorX(error, 'get-creator-card-error');
    throw error;
  }
}

module.exports = getCreatorCard;
