const ENV ={
    API_MODE: 'production',
    API_DEV_URL: './src/data',
    API_PROD_URL: 'https://6afe2ad73a0e70bc8d532a8c.mockapi.io'
};

let API_URL;

switch (ENV.API_MODE) {
    case 'production':
        API_URL = ENV.API_PROD_URL;
        break;

    case 'development':
    default:
        API_URL = ENV.API_DEV_URL;
        break;
}

export { API_URL };