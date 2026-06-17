function toMs(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  return null;
}

function serializeCreatorCard(card, options = {}) {
  const { includeAccessCode = false, deletedAt } = options;
  const serialized = {
    id: card._id,
    title: card.title,
    description: card.description || null,
    slug: card.slug,
    creator_reference: card.creator_reference,
    links: card.links || [],
    service_rates: card.service_rates || null,
    status: card.status,
    access_type: card.access_type,
    created: toMs(card.created),
    updated: deletedAt || toMs(card.updated),
    deleted: deletedAt || toMs(card.deleted),
  };

  if (includeAccessCode) {
    serialized.access_code = card.access_code || null;
  }

  return serialized;
}

module.exports = serializeCreatorCard;
