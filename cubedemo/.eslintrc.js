module.exports = {
    root: true,
    extends: 'eslint-config-futu',
    env: {
        browser: true,
        node: true,
        amd: true
    },
    parserOptions: {
        ecmaVersion: 7,
        sourceType: 'module'
    },
    rules: {
        // 如果项目有特殊需求，可在此覆盖
    }
};