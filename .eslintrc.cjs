module.exports = {
    root: true,
    parser: '@babel/eslint-parser',
    settings: {
        react: {
            version: 'detect',
        },
    },
    env: {
        node: true,
        browser: true,
        es6: true,
        commonjs: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@next/next/recommended',
        'prettier',
    ],
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 2020,
        requireConfigFile: false,
        babelOptions: {
            presets: ['@babel/preset-react'],
        },
    },
    rules: {
        'import/prefer-default-export': 0,
        'no-console': 0, // Отключает предупреждения о console.log
        'no-nested-ternary': 0,
        'no-underscore-dangle': 0,
        'no-unused-expressions': 0, // Отключает ошибки о неиспользуемых выражениях
        'no-unused-vars': 0, // Отключает ошибки о неиспользуемых переменных
        'no-undef': 0, // Отключает ошибки о неопределенных переменных
        'no-useless-catch': 0, // Отключает ошибки о try/catch без полезного кода
        camelcase: 0,
        'react/self-closing-comp': 1,
        'react/jsx-filename-extension': [1, { extensions: ['.js', 'jsx'] }],
        'react/prop-types': 0,
        'react/destructuring-assignment': 0,
        'react/jsx-no-comment-textnodes': 0,
        'react/jsx-props-no-spreading': 0,
        'react/no-array-index-key': 0,
        'react/no-unescaped-entities': 0,
        'react/require-default-props': 0,
        'react/react-in-jsx-scope': 0,
        'linebreak-style': 0, // Отключает ошибки с CRLF/LF
        semi: 0, // Отключает проверку на точки с запятой
    },
};
