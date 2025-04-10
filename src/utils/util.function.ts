import { BadRequestException, HttpStatus } from '@nestjs/common';
import { UAParser } from 'ua-parser-js';
import { encryptionKey, VAPID_PUBLIC_KEY } from './util.constant';
const axios = require('axios');
const { AES, enc } = require('crypto-js');

export const checkForRequiredFields = (
  requiredFields: string[],
  requestPayload: any,
): void => {
  const missingFields = requiredFields.filter(
    (field: string) =>
      Object.keys(requestPayload).indexOf(field) < 0 ||
      Object.values(requestPayload)[
        Object.keys(requestPayload).indexOf(field)
      ] === '',
  );
  if (missingFields.length) {
    throw new BadRequestException(
      `Missing required field(s): '${[...missingFields]}'`,
    );
  }
};

export const compareEnumValues = (value: string, checkAgainst: string[]) => {
  return checkAgainst.includes(value);
};

export const compareEnumValueFields = (
  value: string,
  checkAgainst: string[],
  fieldName?: string,
): void => {
  if (!compareEnumValues(value, checkAgainst)) {
    const message = `Field '${
      fieldName ?? value
    }' can only contain values: ${checkAgainst}`;
    throw new BadRequestException(message);
  }
};

export const validateEmail = (email: string): boolean => {
  const regExp =
    /^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return regExp.test(email);
};

export const validateEmailField = (email: string): void => {
  if (!validateEmail(email)) {
    throw new BadRequestException('Email has invalid format');
  }
};

export const validatePassword = (password: string): void => {
  // Regular expressions to check for the specified conditions
  const lengthRegex = /.{8,}/;
  const uppercaseRegex = /[A-Z]/;
  const lowercaseRegex = /[a-z]/;
  const numberRegex = /[0-9]/;
  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

  // Check if all conditions are met
  const isLengthValid = lengthRegex.test(password);
  const hasUppercase = uppercaseRegex.test(password);
  const hasLowercase = lowercaseRegex.test(password);
  const hasNumber = numberRegex.test(password);
  const hasSpecialChar = specialCharRegex.test(password);

  // Return true if all conditions are met, otherwise false
  const message =
    'Password must contain at least 8 characters, at least 1 capital letter, 1 number and 1 special character';

  if (
    !(
      isLengthValid &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecialChar
    )
  ) {
    throw new BadRequestException(message);
  }
};

export const getIdentity = (
  req: any,
): { clientIp: string; deviceInfo: string } => {
  const parser = new UAParser(req.headers['user-agent']); // Get device info
  const deviceInfo = `${parser.getBrowser().name} on ${parser.getOS().name} (${parser.getDevice().model || 'Unknown Device'})`;
  let clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;
  clientIp = clientIp.includes('::ffff:')
    ? clientIp.split('::ffff:')[1]
    : clientIp;
  console.log('Client IP:', clientIp, 'Device', deviceInfo);
  return { clientIp, deviceInfo };
};

export const getCurrentTime = () =>
  new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long', // Use 'short' or '2-digit' for different formats
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  });

export const getLocation = async (ip): Promise<string> => {
  try {
    // const ipv4 = getIPv4(ip);
    const serverIp = process.env.SERVER_IP ?? '';
    if (!serverIp) {
      return 'Unknown';
    }
    ip = ip === '::1' ? serverIp : ip;
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    console.log(ip, response.data);
    const { city, country, isp } = response.data;
    const parsedLocation = `${city}, ${country}: ${isp}`;
    return parsedLocation;
  } catch (error) {
    console.error('Error fetching location:', error);
    return null;
  }
};

export const axiosErrorLogic = (
  error,
): { status: HttpStatus; message: string } => {
  let status = 404;
  let message = '';
  if (error.code === 'ECONNABORTED' || error.response?.status === 408) {
    // Timeout or explicit 408 error
    status = HttpStatus.REQUEST_TIMEOUT;
    message = 'Request timed out. Please try again later';
  } else if (error.response) {
    // The request was made and the server responded with a status code
    status = error.response.status || HttpStatus.INTERNAL_SERVER_ERROR;
    message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'External service error';
  } else if (error.request) {
    // The request was made but no response was received
    status = HttpStatus.SERVICE_UNAVAILABLE;
    message = 'No response from external service';
  } else {
    // Something happened in setting up the request that triggered an error
    status = HttpStatus.INTERNAL_SERVER_ERROR;
    message = error.message || 'Internal request error';
  }
  return { status, message };
};

export const encrypted = (data) => {
  return AES.encrypt(data, encryptionKey).toString();
};

export const decrypted = (data) => {
  return AES.decrypt(data, encryptionKey).toString(enc.Utf8);
};
