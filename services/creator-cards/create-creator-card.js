const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { randomBytes } = require('@app-core/randomness');
const CreatorCard = require('@app/repository/creator-cards');
const { CreatorCardMessages } = require('@app/messages');
const serializeCreatorCard = require('./serializer');
const throwBusinessError = require('./business-error');

const SPEC = `root {
  title              string<trim|minLength:3|maxLength:100>
  description?       string<trim|maxLength:500>
  slug?              string<trim|minLength:5|maxLength:50>
  creator_reference  string<length:20>
  links[]? {
    title  string<trim|minLength:1|maxLength:100>
    url    string<maxLength:200>
  }
  service_rates? {
    currency  string(NGN|USD|GBP|GHS)
    rates[] {
      name         string<trim|minLength:3|maxLength:100>
      description  string<trim|maxLength:250>
      amount       number<min:1>
    }
  }
  status       string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`;

const parsedSpec = validator.parse(SPEC);

function isAlphaNumericCharacter(character) {
  const code = character.charCodeAt(0);
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isSlugCharacter(character) {
  return isAlphaNumericCharacter(character) || character === '-' || character === '_';
}

function validateSlug(slug) {
  for (let i = 0; i < slug.length; i += 1) {
    if (!isSlugCharacter(slug[i])) {
      throwAppError(
        'Slug may only contain letters, numbers, hyphens, and underscores',
        ERROR_CODE.INVLDDATA
      );
    }
  }
}

function validateAccessCode(accessCode) {
  if (!accessCode) return;

  for (let i = 0; i < accessCode.length; i += 1) {
    if (!isAlphaNumericCharacter(accessCode[i])) {
      throwAppError('access_code must contain only letters and numbers', ERROR_CODE.INVLDDATA);
    }
  }
}

function validateLinks(links) {
  if (!Array.isArray(links)) return;

  links.forEach((link) => {
    if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
      throwAppError('Link URL must start with http:// or https://', ERROR_CODE.INVLDDATA);
    }
  });
}

function validateServiceRates(serviceRates) {
  if (!serviceRates) return;

  if (!Array.isArray(serviceRates.rates) || serviceRates.rates.length === 0) {
    throwAppError('service_rates.rates must be a non-empty array', ERROR_CODE.INVLDDATA);
  }

  serviceRates.rates.forEach((rate) => {
    if (!Number.isInteger(rate.amount) || rate.amount < 1) {
      throwAppError(
        'service_rates.rates[].amount must be a positive integer',
        ERROR_CODE.INVLDDATA
      );
    }
  });
}

function generateSlugFromTitle(title) {
  let slug = '';
  const lowerTitle = title.toLowerCase();

  for (let i = 0; i < lowerTitle.length; i += 1) {
    const character = lowerTitle[i];

    if (character === ' ' || character === '\t' || character === '\n' || character === '\r') {
      slug += '-';
    } else if (isSlugCharacter(character)) {
      slug += character;
    }
  }

  return slug;
}

function generateSuffix() {
  return randomBytes(3);
}

async function resolveSlug(data) {
  if (data.slug) {
    validateSlug(data.slug);

    const existingCard = await CreatorCard.findOne({ query: { slug: data.slug, deleted: null } });
    if (existingCard) {
      throwBusinessError(CreatorCardMessages.SLUG_TAKEN, 'SL02');
    }

    return data.slug;
  }

  let baseSlug = generateSlugFromTitle(data.title);
  if (baseSlug.length > 43) {
    baseSlug = baseSlug.substring(0, 43);
  }

  if (baseSlug.length < 5) {
    return `${baseSlug}-${generateSuffix()}`;
  }

  const existingCard = await CreatorCard.findOne({ query: { slug: baseSlug, deleted: null } });
  if (existingCard) {
    return `${baseSlug}-${generateSuffix()}`;
  }

  return baseSlug;
}

async function createCreatorCard(serviceData) {
  const data = validator.validate(serviceData, parsedSpec);

  try {
    const accessType = data.access_type || 'public';

    if (accessType === 'private' && !data.access_code) {
      throwBusinessError(CreatorCardMessages.ACCESS_CODE_REQUIRED_FOR_PRIVATE, 'AC01');
    }

    if (accessType === 'public' && data.access_code) {
      throwBusinessError(CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED_ON_PUBLIC, 'AC05');
    }

    validateAccessCode(data.access_code);
    validateLinks(data.links);
    validateServiceRates(data.service_rates);

    const slug = await resolveSlug(data);
    const card = await CreatorCard.create({
      title: data.title,
      description: data.description || null,
      slug,
      creator_reference: data.creator_reference,
      links: data.links || [],
      service_rates: data.service_rates || null,
      status: data.status,
      access_type: accessType,
      access_code: data.access_code || null,
      deleted: null,
    });

    return serializeCreatorCard(card, { includeAccessCode: true });
  } catch (error) {
    appLogger.errorX(error, 'create-creator-card-error');
    throw error;
  }
}

module.exports = createCreatorCard;
