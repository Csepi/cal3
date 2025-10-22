module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@api': './src/api',
          '@hooks': './src/hooks',
          '@types': './src/types',
          '@utils': './src/utils',
          '@constants': './src/constants',
          '@services': './src/services',
        },
      },
    ],
  ],
};
