module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'no-restricted-globals': [
      'error',
      {
        name: 'confirm',
        message: 'Please use window.confirm instead.'
      }
    ]
  }
};