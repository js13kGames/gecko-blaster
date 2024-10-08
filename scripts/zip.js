const fs = require("fs");
const exec = require("child_process").exec;

const zip = new require("node-zip")();
const decompress = require("decompress");
const colors = require("colors");
const cheerio = require("cheerio");
const UglifyJS = require("uglify-js");

const DEST_FOLDER = "build";
const MAX_SIZE = 1024 * 13;
const DIR = `${__dirname}/../${DEST_FOLDER}`;

const src = {
  html: fs.readFileSync("public/index.html", "UTF8"),
  js: fs.readFileSync("public/game.js", "UTF8"),
};

const minJs = (js) => {

}

const commit = revision = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString().trim();

const init = (src) => {
  const $ = cheerio.load(src.html);
  $("script").remove();
  let html = $.html();

  if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR);
  }

  const uglify = UglifyJS.minify(src.js);
  let min = uglify.code;
  fs.writeFileSync("build/g.js", min, "binary");
  exec("npx roadroller build/g.js -o build/g2.js", (error) => {
    if (error !== null) {
      console.log(`exec error: ${error}`);
    }
  });
  min = fs.readFileSync("build/g2.js", "UTF8");

  html = html.replace('<script src="game.js"></script>', "");
  html = html.replace("</body>", `<script>BUILD='${commit}';${min}</script></body`);

  let result = fs.writeFileSync(`${DIR}/index.html`, html, "utf8");

  zip.file("index.html", fs.readFileSync("build/index.html"));
  const data = zip.generate({ base64: false, compression: "DEFLATE" });
  fs.writeFileSync("game.zip", data, "binary");

  // run adv.
  exec("sh scripts/advzip.sh", (error, stdout, stderr) => {
    report();
    if (error !== null) {
      console.log(`exec error: ${error}`);
    }
  });
};

const report = () => {
  decompress("game.zip", "./")
    .then(() => {
      console.log("Unzipped to: ./index.html");
    })
    .catch((error) => {
      console.log("Error unzipping", error);
    });

  fs.createReadStream(`${DIR}/index.html`).pipe(
    fs.createWriteStream(`${__dirname}/../index.html`),
  );

  const stats = fs.statSync(`${__dirname}/../game.zip`);
  const remaining = MAX_SIZE - stats.size;
  let percent = Math.floor(((MAX_SIZE - remaining) / MAX_SIZE) * 100);
  console.log();
  console.log();
  if (stats.size < MAX_SIZE) {
    console.log(" S U C C E S S ! ! ".rainbow);
    console.log("-------------------".rainbow);
    console.log();
    console.log("Total bytes: .............. " + stats.size);
    console.log("Remaining bytes: .......... " + remaining);
    console.log("Percentage used:  ......... " + percent + "%");
  } else {
    console.log("TOO BIG! :(");
    console.log("Total bytes:" + stats.size);
    console.log("Remaining bytes: " + remaining);
  }
  console.log();
};


init(src);
