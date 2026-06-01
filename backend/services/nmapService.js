const util = require("util");
const exec = util.promisify(require("child_process").exec);

const nmapScan = async (target) => {
  let host = target.replace(/^https?:\/\//, "").split("/")[0];

  try {
    const { stdout } = await exec(`nmap -F -T4 --host-timeout 30s ${host}`);
    const ports = parseScan(stdout);

    return ports;
  } catch (error) {
    console.error("nmap execution error", error.message);
  }
};

const parseScan = (output) => {
  const ports = [];
  const lines = output.split(/\r?\n/);

  for (let line of lines) {
    const match = line.match(/^(\d+)\/tcp\s+(\S+)\s+(.+)$/);

    if (match) {
      ports.push({
        port: Number(match[1]),
        state: match[2],
        service: match[3],
      });
    }
  }
  return ports;
};

module.exports = nmapScan;
