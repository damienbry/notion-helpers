const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

/*
const SIMPLE_PROPERTY_VALUES = [
  "date",
  "string",
  "number",
  "boolean",
  "checkbox",
  "email",
  "phone_number",
];
*/
const COMPLEX_PROPERTY_VALUES = {
  title: (p) => p.title.map((rt) => rt.plain_text).join(""),
  rich_text: (p) => p.rich_text.map((rt) => rt.plain_text).join(""),
  multi_select: (p) => p.multi_select.map((ms) => ms.name).join(","),
  files: (p) => p.files.map((f) => f[f.type].url).join(","),
  select: (p) => (p.select ? p.select.name : p.select),
  formula: (p) => {
    const complexProp = COMPLEX_PROPERTY_VALUES[p.formula.type];
    return complexProp ? complexProp(p.formula) : p.formula[p.formula.type];
  },
};

const getBlockChildren = async (
  blockId,
  startCursor = undefined,
  pageSize = 100
) => {
  const response = await notion.blocks.children.list({
    block_id: blockId,
    start_cursor: startCursor,
    page_size: pageSize,
  });

  let children = response.results;

  if (response.has_more) {
    const newChildren = await getBlockChildren(
      blockId,
      response.next_cursor,
      pageSize
    );
    children = children.concat(newChildren);
  }

  return children;
};

const navigateDeepBlocks = async (
  blockId,
  hasChildren,
  navigator,
  rateLimit
) => {
  if (hasChildren) {
    if (rateLimit && rateLimit > 0) {
      await new Promise((resolve) => setTimeout(() => resolve(), rateLimit));
    }
    const children = await getBlockChildren(blockId);

    for (const child of children) {
      await navigator(child);
      if (!child.id) {
        console.log(" 🥴 child WITH ID UNDEFINED", child);
      }
      await navigateDeepBlocks(child.id, child.has_children, navigator);
    }
  }
};

module.exports = {
  pollDatabase: async (databaseId) => {
    const pages = [];
    let cursor = undefined;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { results, next_cursor } = await notion.databases.query({
        database_id: databaseId,
        start_cursor: cursor,
      });
      pages.push(...results);
      if (!next_cursor) {
        break;
      }
      cursor = next_cursor;
    }

    return pages;
  },
  getPage: async (pageId) => await notion.pages.retrieve({ page_id: pageId }),
  insertPage: async (page, databaseId) => {
    const newPage = {
      parent: {
        database_id: databaseId,
      },
      ...page,
    };
    await notion.pages.create(newPage);
  },
  updatePage: async (pageId, property) => {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        ...property,
      },
    });
  },
  updateBlock: async (blockId, content) => {
    await notion.blocks.update({
      ...content,
      block_id: blockId,
    });
    await new Promise((resolve) => setTimeout(() => resolve(), 1000)); // AVOID NOTION INTERNAL CONFLICT
  },
  getBlock: async (blockId) => {
    const response = await notion.blocks.retrieve({
      block_id: blockId,
    });
    return response;
  },
  getBlockChildren,
  navigateDeepBlocks,
  getValue: (property) => {
    const complexProp = COMPLEX_PROPERTY_VALUES[property.type];
    return complexProp ? complexProp(property) : property[property.type];
  },
};
