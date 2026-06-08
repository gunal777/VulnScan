const net = require("net");

const isValidIP = (target) => {
  return net.isIP(target) !== 0;
};

const isValidURL = (target) => {
  try {
    new URL(target);
    return true;
  } catch {
    return false;
  }
};

const isValidDomain = (target) => {
  const regex = /^(?!-)[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

  return regex.test(target);
};

const detectTargetType = (target) => {
  if (isValidIP(target)) return "ip";
  if (isValidURL(target)) return "url";
  if (isValidDomain(target)) return "domain";

  return null;
};

const containsDangerousChars = (target) => {
  return /[;|`$<>]/.test(target);
};

module.exports = {
  detectTargetType,
  containsDangerousChars,
};
