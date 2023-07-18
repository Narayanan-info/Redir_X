const axios = require("axios");
const fs = require("fs");
const urlLib = require("url");

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  url: "",
  payloads: "",
  thread: "",
  whitelist_domain: "",
  cookies: "",
};

function usage() {
console.log("           ███████████            ██████████    ███                      █████ █████ ");
console.log("          ░░███░░░░░███          ░░███░░░░███  ░░░                      ░░███ ░░███ ");
console.log("           ░███    ░███   ██████  ░███   ░░███ ████  ████████            ░░███ ███ ");
console.log(" 	    ██████████   ███░░███ ░███    ░███░░███ ░░███░░███            ░░█████ ");
console.log("	   ░███░░░░░███ ░███████  ░███    ░███ ░███  ░███ ░░░              ███░███ ");
console.log("           ░███    ░███ ░███░░░   ░███    ███  ░███  ░███                 ███ ░░███ ");
console.log("           █████   █████░░██████  ██████████   █████ █████   █████████   █████ █████ ");
console.log("           ░░░░░   ░░░░░  ░░░░░░  ░░░░░░░░░░   ░░░░░ ░░░░░   ░░░░░░░░░   ░░░░░ ░░░░░ ");
console.log("	                           Advance Open Redirection Scanner          ");
console.log("		                            By: Narayanan | @infops              ");
console.log("	                             Hackerone & Bugcroud | @infops          ");
  console.log(
    "Usage: node RedirX_dev.js -u <URL> -p <payload_file> [-t <thread>] [-w <whitelist_domain>] [-c <cookies>]"
  );
  console.log("       -u: Enter the URL");
  console.log("       -p: Enter payload file");
  console.log("       -t: Enter thread value (1: Fastest 100: Normal)");
  console.log("       -w: Enter whitelisted domain");
  console.log("       -c: Enter cookies value (For authenticated endpoints)");
  process.exit(1);
}

for (let i = 0; i < args.length; i++) {
  if (args[i] === "-u" && i + 1 < args.length) {
    options.url = args[i + 1];
  } else if (args[i] === "-p" && i + 1 < args.length) {
    options.payloads = args[i + 1];
  } else if (args[i] === "-t" && i + 1 < args.length) {
    options.thread = args[i + 1];
  } else if (args[i] === "-w" && i + 1 < args.length) {
    options.whitelist_domain = args[i + 1];
  } else if (args[i] === "-c" && i + 1 < args.length) {
    options.cookies = args[i + 1];
  }
}

// Check for mandatory options
if (!options.url || !options.payloads) {
  usage();
}

// Print the banner
console.log("\x1b[34m");
console.log("           ███████████            ██████████    ███                      █████ █████ ");
console.log("          ░░███░░░░░███          ░░███░░░░███  ░░░                      ░░███ ░░███ ");
console.log("           ░███    ░███   ██████  ░███   ░░███ ████  ████████            ░░███ ███ ");
console.log(" 	    ██████████   ███░░███ ░███    ░███░░███ ░░███░░███            ░░█████ ");
console.log("	   ░███░░░░░███ ░███████  ░███    ░███ ░███  ░███ ░░░              ███░███ ");
console.log("           ░███    ░███ ░███░░░   ░███    ███  ░███  ░███                 ███ ░░███ ");
console.log("           █████   █████░░██████  ██████████   █████ █████   █████████   █████ █████ ");
console.log("           ░░░░░   ░░░░░  ░░░░░░  ░░░░░░░░░░   ░░░░░ ░░░░░   ░░░░░░░░░   ░░░░░ ░░░░░ ");
console.log("	                           Advance Open Redirection Scanner          ");
console.log("		                            By: Narayanan | @infops              ");
console.log("	                             Hackerone & Bugcroud | @infops          ");
console.log("\x1b[0m");

class Scanner {
  constructor(url, payloadFile) {
    this.url = url;
    this.payloadFile = payloadFile;
  }

  openFile() {
    return fs.readFileSync(this.payloadFile, "utf8").split(/\s+/);
  }

  payloadParser() {
    const payloads = this.openFile();
    const finalPayloads = [];
    for (const payload of payloads) {
      if (payload.includes("whitelist")) {
        finalPayloads.push(
          payload.replace("%whitelist%", options.whitelist_domain)
        );
      } else {
        finalPayloads.push(payload);
      }
    }
    console.log(`\x1b[32m[+] ${finalPayloads.length} PAYLOADS LOADED\x1b[0m`);
    return finalPayloads;
  }

  parseUrl(url, payload) {
    const { query } = urlLib.parse(url);
    const key = query ? query.split("=")[0] : "";
    const finalUrl = new URL(url);
    finalUrl.searchParams.set(key, payload);
    return finalUrl.href;
  }

  async scanner(payloads, cookies) {
    for (const payload of payloads) {
      const url = this.parseUrl(this.url, payload);
      try {
        const response = await (cookies
          ? axios.get(url, { headers: { Cookie: cookies } })
          : axios.get(url));
        const locationHeader = response.headers["location"];
        if (!locationHeader) {


          // No Location header in response, possible open redirection

          console.log(
            "\x1b[34mPossible Open Redirection with ",
            url,
            "\x1b[0m"
          );
          continue;
        }
        const { hostname } = new URL(locationHeader);
        if (hostname === options.whitelist_domain) {
          console.log("\x1b[31mVulnerable ", url, "\x1b[0m");
        }
      } catch (error) {
        if (
          error.response &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          console.log(
            "\x1b[31mWarning: GETTING",
            error.response.status,
            url,
            "\x1b[0m"
          );
        }
      }
    }
  }

  async start() {
    const payloads = this.payloadParser();
    const threadCount = options.thread ? parseInt(options.thread) : 100;
    const dividedPayloads = this.divideArray(payloads, threadCount);
    const cookies = this.parseCookies(options.cookies);

    try {
      await Promise.all(
        dividedPayloads.map((payloads) => this.scanner(payloads, cookies))
      );
    } catch (error) {
      console.error("Error:", error);
    }
  }

  divideArray(arr, n) {
    const result = [];
    const len = Math.ceil(arr.length / n);
    for (let i = 0; i < arr.length; i += len) {
      result.push(arr.slice(i, i + len));
    }
    return result;
  }

  parseCookies(cookiesStr) {
    if (!cookiesStr) return null;
    const cookies = {};
    const cookieArr = cookiesStr.split(";");
    for (const cookie of cookieArr) {
      const [name, value] = cookie.trim().split("=");
      cookies[name] = value;
    }
    return cookies;
  }
}

const scanner = new Scanner(options.url, options.payloads);
scanner.start();
