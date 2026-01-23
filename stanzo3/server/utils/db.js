const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

const getPath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const read = async (collection) => {
    try {
        const filePath = getPath(collection);
        if (!await fs.pathExists(filePath)) return [];
        return await fs.readJson(filePath);
    } catch (err) {
        console.error(`Error reading ${collection}:`, err);
        return [];
    }
};

const write = async (collection, data) => {
    try {
        await fs.writeJson(getPath(collection), data, { spaces: 2 });
        return true;
    } catch (err) {
        console.error(`Error writing ${collection}:`, err);
        return false;
    }
};

module.exports = { read, write };
