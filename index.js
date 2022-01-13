const {Client} = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const SIMPLE_PROPERTY_VALUES = ['date', 'string', 'number', 'boolean', 'checkbox', 'email', 'phone_number'];
const COMPLEX_PROPERTY_VALUES = {
  title: (p) => p.title.map(rt => rt.plain_text).join(''),
  rich_text: (p) => p.rich_text.map(rt => rt.plain_text).join(''),
  multi_select: (p) => p.multi_select.map(ms => ms.name).join(','),
  files: (p) => p.files.map(f => f[f.type].url).join(','),
  select: (p) => p.select.name,
};

module.exports = {
  pollDatabase: async (databaseId) => {
    const pages = []
    let cursor = undefined

    while (true) {
      const { results, next_cursor } = await notion.databases.query({
        database_id: databaseId,
        start_cursor: cursor,
      })
      pages.push(...results)
      if (!next_cursor) {
        break
      }
      cursor = next_cursor
    }

    return pages;
  },
  insertPage: async (pages, databaseId) => {
    const newPage = {
      parent: {
        database_id: databaseId
      },
      cover: page.cover,
      icon: page.icon,
      properties: renamedProperties,
    };
    const response = await notion.pages.create(newPage);
  },
  updatePage: async (pageId, property) => {
    const response = await notion.pages.update({
      page_id: pageId,
      properties: {
        ...property
      },
    });
  },
  getValue: (property) => {
    const complexProp = COMPLEX_PROPERTY_VALUES[property.type]
    return complexProp ? complexProp(property) : property[property.type];
  }
};

