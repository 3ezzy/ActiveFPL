import axios from 'axios';

const fplClient = axios.create({
  baseURL: '/api',
});

export default fplClient;
