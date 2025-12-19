// pao-downloader-puppeteer-v24.js
// PAO automation for Excel downloads - Puppeteer v24 compatible
// Usage: node pao-downloader-puppeteer-v24.js

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }
function getChromePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];
  return paths.find(p => fs.existsSync(p));
}

const chromePath = getChromePath();
if (!chromePath) {
  throw new Error('Google Chrome not found. Please install Chrome.');
}
class PAODownloader {
  constructor() {
    const os = require('os');

const BASE_DIR = process.pkg
  ? process.cwd()        
  : __dirname;             

this.downloadPath = path.join(BASE_DIR, 'downloads');

    this.browser = null;
    this.page = null;
  }

  async initialize() {
    if (!fs.existsSync(this.downloadPath)) fs.mkdirSync(this.downloadPath, { recursive: true });

    this.browser = await puppeteer.launch({
      headless: false,
      executablePath: chromePath,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const pages = await this.browser.pages();
    this.page = pages[0] || await this.browser.newPage();

    // Enable downloads
    const client = await this.page.createCDPSession();
    await client.send('Page.setDownloadBehavior', { 
      behavior: 'allow', 
      downloadPath: this.downloadPath 
    });

    // Attach new popup pages
    this.browser.on('targetcreated', async (target) => {
      try {
        if (target.type() === 'page') {
          const p = await target.page();
          if (p) {
            this.page = p;
            await this.page.bringToFront();
            console.log('🔄 Attached to new page/window');
          }
        }
      } catch (e) {}
    });

    this.page.setDefaultNavigationTimeout(120000);
    this.page.setDefaultTimeout(120000);

    console.log('🚀 Browser launched. Ready for manual login (OTP).');
  }

  async navigateToLogin() {
    const loginUrl = 'https://app.indiapost.gov.in/idam/realms/indiapost/protocol/openid-connect/auth?response_type=code&client_id=internal_client&redirect_uri=https%3A%2F%2Fapp.indiapost.gov.in%2Femployeeportal%2Fapi%2Fauth%2Fcallback%2Fkeycloak&nextauth=keycloak&code_challenge=XRdTYioiiUlHJXiSH3L9wI6a4kIHUrwWZ5rWYVLD5b4&code_challenge_method=S256&scope=openid+profile+email';
    await this.page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    console.log('\n📌 Please login manually (OTP). If the callback/spinner(500 Server error) appears, press ENTER here to resume tool execution.');
  }

  waitForEnter() {
    return new Promise(resolve => process.stdin.once('data', () => resolve()));
  }

  async forceDashboard() {
    console.log('🔄 Forcing navigation to dashboard...');
    await this.page.goto('https://app.indiapost.gov.in/employeeportal/home', { waitUntil: 'domcontentloaded' });
    await delay(1000);
    console.log('✅ Dashboard loaded');
  }
   
  // Click top menu PAO link (href contains /pao)
  async openPAOModule() {
    console.log('➡ Opening PAO Module (top link)...');

    try {
      // Puppeteer v24 syntax - wait for element and click
      const selector = "a[href*='/pao']";
      await this.page.waitForSelector(selector, { timeout: 5000 });
      await this.page.click(selector);
      await delay(1200);
      console.log('✅ Clicked PAO Module link');
      return;
    } catch (e) {
      console.log('⚠ PAO Module link not found automatically — open manually then press ENTER.');
      await this.waitForEnter();
    }
  }
  

  // Click PAO tile (div role=button with inner p[text()="PAO"])
  async clickPAOTile() {
    console.log('➡ Clicking PAO tile...');
    
    try {
      // Try to find and click PAO tile
      const found = await this.page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div[role="button"]'));
        const paoDiv = divs.find(div => {
          const p = div.querySelector('p');
          return p && p.textContent.trim() === 'PAO';
        });
        if (paoDiv) {
          paoDiv.click();
          return true;
        }
        return false;
      });

      if (found) {
        await delay(1000);
        console.log('✅ Clicked PAO tile');
        return;
      }

      // Fallback: clickable anchor to /pao
      const selector = "a[href*='/pao']";
      await this.page.waitForSelector(selector, { timeout: 3000 });
      await this.page.click(selector);
      await delay(1000);
      console.log('✅ Clicked PAO anchor (fallback)');
      return;
    } catch (e) {
      console.log('⚠ PAO tile not found — open manually then press ENTER.');
      await this.waitForEnter();
    }
  }

  // Click Verify Daily Cash Book anchor
  async openVerifyDailyCashBook() {
    console.log('➡ Opening Verify Daily Cash Book...');
    
    try {
      const selector = "a[href*='verify-daily-cashbook']";
      await this.page.waitForSelector(selector, { timeout: 5000 });
      await this.page.click(selector);
      await delay(1200);
      console.log('✅ Opened Verify Daily Cash Book');
      return;
    } catch (e) {
      // Fallback: try h3 text
      const found = await this.page.evaluate(() => {
        const h3s = Array.from(document.querySelectorAll('h3'));
        const h3 = h3s.find(el => el.textContent.trim() === 'Verify Daily Cash Book');
        if (h3) {
          h3.click();
          return true;
        }
        return false;
      });

      if (found) {
        await delay(1200);
        console.log('✅ (fallback) clicked Verify Daily Cash Book');
        return;
      }

      console.log('⚠ Verify Daily Cash Book not found — open manually then press ENTER.');
      await this.waitForEnter();
    }
  }

  // Fill date input and click Fetch
  async enterDateAndFetch(dateString) {
    console.log(`📅 Entering date ${dateString} ...`);
    
    try {
      // Try input[type=date] first
      const dateInput = await this.page.$("input[type='date']");
      if (dateInput) {
        // Click to focus first
        await dateInput.click();
        await delay(300);
        
        // Clear existing value
        await this.page.evaluate(() => {
          const el = document.querySelector("input[type='date']");
          if (el) el.value = '';
        });
        await delay(200);
        
        // Set new value with multiple event triggers
        await this.page.evaluate((val) => {
          const el = document.querySelector("input[type='date']");
          if (!el) return;

          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          ).set;

          nativeInputValueSetter.call(el, val);

          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }, dateString);

        await delay(800);
        console.log('✅ Date entered');
      } else {
        // Fallback: try any input field
        const inputs = await this.page.$('input');
        if (inputs.length) {
          await inputs[0].click();
          await delay(200);
          // Clear field first
          await this.page.keyboard.down('Control');
          await this.page.keyboard.press('KeyA');
          await this.page.keyboard.up('Control');
          await this.page.keyboard.press('Backspace');
          await delay(200);
          // Type date
          await this.page.keyboard.type(dateString, { delay: 50 });
          await delay(500);
          console.log('✅ Date typed');
        } else {
          console.log('⚠ No input found to set date — please set date manually then press ENTER');
          await this.waitForEnter();
        }
      }
    } catch (e) {
      console.log('⚠ Error setting date:', e.message);
      console.log('Please set date manually then press ENTER');
      await this.waitForEnter();
    }
               
    // Click Fetch button
    console.log('➡ Clicking Fetch button...');
    try {
      const found = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button[type='submit']"));
        const fetchBtn = buttons.find(btn => btn.textContent.trim() === 'Fetch');
        if (fetchBtn) {
          fetchBtn.click();
          return true;
        }
        return false;
      });

      if (found) {
        await delay(2000);
        console.log('✅ Fetch clicked');
        return;
      }

      console.log('⚠ Fetch button not found automatically — please click Fetch manually then press ENTER');
      await this.waitForEnter();
      await delay(800);
    } catch (e) {
      console.log('⚠ Error clicking Fetch:', e.message);
      console.log('Please click Fetch manually then press ENTER');
      await this.waitForEnter();
    }
  }

  // Click the "Received" summary card
  async clickReceivedCard() {
    console.log("➡ Clicking Received summary card...");

    await this.page.waitForSelector("div.card-content", { timeout: 15000 });

    const cards = await this.page.$$("div.card-content");

    for (const card of cards) {
      const text = await this.page.evaluate(el => el.innerText, card);

      if (text.includes("Recieved")) {   // ⚠ spelling matters
        await card.scrollIntoViewIfNeeded();
        await card.click();
        console.log("✅ Clicked Received card");
        return;
      }
    }

    throw new Error("❌ Received card not found");
  }

  listDownloads() {
    try {
      return fs.readdirSync(this.downloadPath);
    } catch (e) {
      return [];
    }
  }

  async waitForNewFile(beforeFiles, timeout = 30000) {
    const t0 = Date.now();
    const initialFileStats = new Map();
    
    // Get initial file modification times
    beforeFiles.forEach(f => {
      try {
        const stat = fs.statSync(path.join(this.downloadPath, f));
        initialFileStats.set(f, stat.mtimeMs);
      } catch (e) {}
    });

    while (Date.now() - t0 < timeout) {
      const nowFiles = this.listDownloads();
      
      // Check for new files
      const newFiles = nowFiles.filter(f => !beforeFiles.includes(f));
      const completed = newFiles.filter(f => !f.endsWith('.crdownload') && !f.endsWith('.tmp') && !f.endsWith('.part'));
      if (completed.length) return completed[0];
      
      // Check for modified existing files (e.g., export.xls being overwritten)
      for (const file of nowFiles) {
        if (file.endsWith('.crdownload') || file.endsWith('.tmp') || file.endsWith('.part')) continue;
        
        try {
          const stat = fs.statSync(path.join(this.downloadPath, file));
          const oldTime = initialFileStats.get(file);
          
          // If file is new or was modified after we started waiting
          if (!oldTime || stat.mtimeMs > oldTime + 1000) {
            // Wait a bit more to ensure download is complete
            await delay(1000);
            return file;
          }
        } catch (e) {}
      }
      
      await delay(500);
    }
    return null;
  }

  async rowHasReceived(rowElement) {
    return await this.page.evaluate(row => {
      const svg = row.querySelector("svg[data-icon='circle-check']");
      if (!svg) return false;

      const style = svg.getAttribute('style') || '';
      return style.includes('rgb(16, 185, 129)'); // green check
    }, rowElement);
  }
async getPageRangeText() {
  return await this.page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const rangeSpan = spans.find(s => /\d+\s*-\s*\d+\s*of\s*\d+/i.test(s.textContent));
    return rangeSpan ? rangeSpan.textContent.trim() : null;
  });
}
async getFirstDDO() {
  return await this.page.evaluate(() => {
    const cell = document.querySelector('[data-column-id="1"]');
    return cell ? cell.innerText.trim() : null;
  });
}

async ensureOnPage(pageIndex) {
  const currentRange = await this.getPageRangeText();

  if (!currentRange) return;

  const expectedStart = (pageIndex - 1) * 10 + 1;

  if (!currentRange.startsWith(String(expectedStart))) {
    console.log(`🔄 Page reset detected. Returning to page ${pageIndex}...`);

    await this.page.evaluate((idx) => {
      const btn = [...document.querySelectorAll('button')]
        .find(b => b.textContent.trim() === String(idx));
      if (btn) btn.click();
    }, pageIndex);

    await this.page.waitForFunction(
      (start) => {
        const spans = [...document.querySelectorAll('span')];
        const r = spans.find(s => /\d+\s*-\s*\d+\s*of\s*\d+/i.test(s.textContent));
        return r && r.textContent.trim().startsWith(start);
      },
      { timeout: 15000 },
      String(expectedStart)
    );

    await delay(1000);
  }
}




  async processCurrentPage(dateString, pageIndex, ddoSelection, processedDDOs) {
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

    
    
    console.log(`📄 Processing page ${pageIndex}...`);

    await this.page.waitForSelector('div[role="row"]', { timeout: 10000 });
    
    let fileCounter = 0;
    let rowIndex = 0;

    while (true) {
      // ✅ Re-query rows on each iteration to avoid stale references
      const rows = await this.page.$$('div[role="row"]');
      
      if (rowIndex >= rows.length) {
        break; // No more rows to process
      }

      const row = rows[rowIndex];

      const ddoCode = await row.evaluate(r => {
        const cell = r.querySelector('[data-column-id="1"]');
        return cell ? cell.innerText.trim() : null;
      });

      if (!ddoCode) {
        rowIndex++;
        continue;
      }

      // ✅ Skip if already processed
      if (processedDDOs.has(ddoCode)) {
        console.log(`⏭ Skipping already processed DDO: ${ddoCode}`);
        rowIndex++;
        continue;
      }

      if (ddoSelection.mode === 'selected' && !ddoSelection.codes.has(ddoCode)) {
        rowIndex++;
        continue;
      }

      const received = await this.rowHasReceived(row);
      if (!received) {
        rowIndex++;
        continue;
      }

      fileCounter++;
      console.log(`⬇ Page ${pageIndex} Row ${rowIndex + 1} → DDO ${ddoCode}`);

      const beforeFiles = this.listDownloads();

      const clicked = await this.page.evaluate((ddo) => {
  const rows = [...document.querySelectorAll('div[role="row"]')];
  const target = rows.find(r => {
    const cell = r.querySelector('[data-column-id="1"]');
    return cell && cell.innerText.trim() === ddo;
  });
  if (!target) return false;

  const btn = [...target.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'View Cash Book');
  if (!btn) return false;

  btn.click();
  return true;
}, ddoCode);


      if (!clicked) {
        console.log(`   ⚠ View Cash Book button not found for DDO ${ddoCode}`);
        rowIndex++;
        continue;
      }
      
      console.log('   Clicked View Cash Book, waiting for modal...');
      await delay(1500);

      // wait for modal to fully open
      try {
        await this.page.waitForFunction(() => {
          return [...document.querySelectorAll('button')]
            .some(b => b.textContent.trim() === 'Download');
        }, { timeout: 15000 });
        console.log('   Modal opened, Download button found');
      } catch (e) {
        console.log('   ⚠ Download button not found, skipping');
        rowIndex++;
        continue;
      }

      // click Download
      await delay(500);
      const downloadClicked = await this.page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')]
          .find(b => b.textContent.trim() === 'Download');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });

      if (!downloadClicked) {
        console.log('   ⚠ Could not click Download button');
        rowIndex++;
        continue;
      }
      console.log('   Clicked Download button');
      await delay(1000);

      // wait for Download Excel
      try {
        await this.page.waitForFunction(() => {
          return [...document.querySelectorAll('button')]
            .some(b => b.textContent.trim() === 'Download Excel');
        }, { timeout: 15000 });
        console.log('   Download Excel button found');
      } catch (e) {
        console.log('   ⚠ Download Excel button not found');
        rowIndex++;
        continue;
      }

      // click Download Excel
      await delay(500);
      const excelClicked = await this.page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')]
          .find(b => b.textContent.trim() === 'Download Excel');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });

      if (!excelClicked) {
        console.log('   ⚠ Could not click Download Excel button');
        rowIndex++;
        continue;
      }
      console.log('   Clicked Download Excel button, waiting for file...');

      const newFile = await this.waitForNewFile(beforeFiles, 45000);
      if (newFile) {
        console.log(`   📥 File downloaded: ${newFile}`);
        
        const [year, month] = dateString.split('-');
const fileName = `${ddoCode}-${dateString}.xls`;

const tempPath = path.join(this.downloadPath, newFile);


const dateBase = path.join(this.downloadPath, 'by-date', year, month);
ensureDir(dateBase);

const datePath = path.join(dateBase, fileName);
fs.copyFileSync(tempPath, datePath);


const ddoBase = path.join(this.downloadPath, 'by-ddo', ddoCode, year, month);
ensureDir(ddoBase);

const ddoPath = path.join(ddoBase, fileName);
fs.copyFileSync(tempPath, ddoPath);


fs.unlinkSync(tempPath);

console.log(`✅ Saved:
   📁 by-date/${year}/${month}/${fileName}
   📁 by-ddo/${ddoCode}/${year}/${month}/${fileName}`);

processedDDOs.add(ddoCode);

         
      } else {
        console.log(`   ⚠ Download timeout - no file received for DDO ${ddoCode}`);
        processedDDOs.add(ddoCode);
      }
await this.page.evaluate(() => {
  const btn = document.querySelector('button[data-modal-hide]');
  if (btn) btn.click();
});


      

  
  

await delay(1200);
// Re-wait for rows instead of forcing pagination
await this.page.waitForSelector('div[role="row"]', { timeout: 10000 });

rowIndex++;


     

     
    }

    return fileCounter;
  }

  async processAllPagesForDate(dateString, ddoSelection) {
    let pageIndex = 1;
    let total = 0;
    const processedDDOs = new Set(); // ✅ Track processed DDOs across all pages
    
    while (true) {
      // ✅ Wait for page to be stable
      await delay(1000);
      await this.page.waitForSelector('div[role="row"]', { timeout: 10000 });
      
      const pageTotal = await this.processCurrentPage(
        dateString,
        pageIndex,
        ddoSelection,
        processedDDOs // ✅ Pass the tracking set
      );
      
      total += pageTotal;
      if(total == ddoSelection.count){
         console.log(`📦 Total downloads for ${dateString}: ${total}`);
    return total;
      }
      // ✅ If no new files on page 2+, probably stuck or duplicate data
      

      // Check Next Page button
      const canGoNext = await this.page.evaluate(() => {
        const btn = document.querySelector('#pagination-next-page');
        if (!btn) return false;
        if (btn.disabled) return false;
        if (btn.classList.contains('disabled')) return false;
        const aria = btn.getAttribute('aria-disabled');
        if (aria === 'true') return false;
        return true;
      });

      if (!canGoNext) {
        console.log('🚫 Last page reached (button disabled)');
        break;
      }

     console.log('➡ Going to next page...');

// Capture current range (e.g., "1-10 of 71")
const prevRange = await this.getPageRangeText();

if (!prevRange) {
  console.log('⚠ Could not detect page range — stopping pagination');
  break;
}

// Click Next
await this.page.click('#pagination-next-page');

// Wait until range text changes (React-safe)
try {
  await this.page.waitForFunction(
    (oldRange) => {
      const spans = Array.from(document.querySelectorAll('span'));
      const cur = spans.find(s => /\d+\s*-\s*\d+\s*of\s*\d+/i.test(s.textContent));
      return cur && cur.textContent.trim() !== oldRange;
    },
    { timeout: 15000 },
    prevRange
  );

  const newRange = await this.getPageRangeText();
  console.log(`✅ Page changed: ${prevRange} → ${newRange}`);
} catch (e) {
  console.log('⚠ Pagination did not advance — stopping');
  break;
}

// Allow table to settle
await delay(1200);
pageIndex++;


    }

    console.log(`📦 Total downloads for ${dateString}: ${total}`);
    return total;
  }

  async closeInnerModalIfAny() {
    try {
      const closed = await this.page.evaluate(() => {
        const btn = document.querySelector('button[data-modal-hide]');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });

      if (closed) {
        console.log('Closed inner modal via data-modal-hide button.');
        return;
      }

      const srClosed = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const closeBtn = buttons.find(btn => {
          const span = btn.querySelector('span');
          return span && span.textContent.trim() === 'Close modal';
        });
        if (closeBtn) {
          closeBtn.click();
          return true;
        }
        return false;
      });

      if (srClosed) {
        console.log('Closed inner modal via sr-only Close modal button.');
        return;
      }

     
    } catch (e) {}
  }
async changeRowRange() {
  console.log('➡ Changing rows per page to 30');

 
  await this.page.waitForSelector('select[aria-label="Rows per page:"]', {
    visible: true,
    timeout: 15000
  });


  await this.page.select('select[aria-label="Rows per page:"]', '30');

  delay(1500);

  console.log('✅ Rows per page set to 30');
}

  async closeOuterModalIfAny() {
    try {
      const closed = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const closeBtn = buttons.find(btn => {
          const svg = btn.querySelector('svg');
          const span = btn.querySelector('span');
          return svg && span && span.textContent.includes('Close modal');
        });
        if (closeBtn) {
          closeBtn.click();
          return true;
        }

        // Try clicking any close-looking svg
        const svgs = Array.from(document.querySelectorAll('svg'));
        const closeSvg = svgs.find(svg => {
          const viewBox = svg.getAttribute('viewBox') || '';
          return viewBox.includes('0 0 14 14');
        });
        if (closeSvg) {
          closeSvg.click();
          return true;
        }

        return false;
      });

      if (closed) {
        console.log('Closed modal via close button.');
        return;
      }

      await this.page.keyboard.press('Escape');
      console.log('Closed modal via Escape key.');
    } catch (e) {}
  }

  
  async close() {
    try { await this.browser.close(); } catch(e){}
  }
}

// CLI helpers
function ask(q) {
  const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(q, ans => { rl.close(); res(ans); }));
}

function monthNameToNumber(name) {
  const months = {
    january: 0, february: 1, march: 2, april: 3,
    may: 4, june: 5, july: 6, august: 7,
    september: 8, october: 9, november: 10, december: 11
  };

  return months[name.toLowerCase()] ?? null;
}
function isValidDateString(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime()) && s === d.toISOString().slice(0, 10);
}

function askUntilValid(question, validator) {
  return new Promise(async (resolve) => {
    while (true) {
      const ans = (await ask(question)).trim();
      if (ans === '-1') return resolve(-1);
      if (validator(ans)) return resolve(ans);
      console.log('❌ Invalid input. Please try again or enter -1 to go back.');
    }
  });
}

async function getDatesFromUser() {
  while (true) {
    console.log('\nDate input options:');
    console.log('[1] Specific dates (comma-separated, YYYY-MM-DD)');
    console.log('[2] Date range (start and end)');
    console.log('[3] Last N days');
    console.log('[4] Entire month (enter month name and year)');
    console.log('[-2] Quit');

    const ch = (await ask('Choose option: ')).trim();

    if (ch === '-2') return -2;

    // ---------- OPTION 1 ----------
    if (ch === '1') {
      const input = await askUntilValid(
        'Enter dates (comma-separated) or -1 to go back: ',
        s => s.split(',').every(d => isValidDateString(d.trim()))
      );
      if (input === -1) continue;
      return input.split(',').map(x => x.trim());
    }

    // ---------- OPTION 2 ----------
    if (ch === '2') {
      const start = await askUntilValid(
        'Start date (YYYY-MM-DD) or -1: ',
        isValidDateString
      );
      if (start === -1) continue;

      const end = await askUntilValid(
        'End date (YYYY-MM-DD) or -1: ',
        isValidDateString
      );
      if (end === -1) continue;

      if (new Date(start) > new Date(end)) {
        console.log('❌ Start date cannot be after end date.');
        continue;
      }

      const res = [];
      let cur = new Date(start);
      const e = new Date(end);
      while (cur <= e) {
        res.push(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 1);
      }
      return res;
    }

    // ---------- OPTION 3 ----------
    if (ch === '3') {
      const n = await askUntilValid(
        'How many days back? ',
        v => /^\d+$/.test(v) && Number(v) > 0
      );
      if (n === -1) continue;

      const res = [];
      for (let i = 0; i < Number(n); i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        res.push(d.toISOString().slice(0, 10));
      }
      return res;
    }

    // ---------- OPTION 4 ----------
    if (ch === '4') {
      const month = (await ask('Enter month name[Eg: DECEMBER or December or december] or -1[To go back to previous menu]: ')).trim();
      if (month === '-1') continue;

      const year = await askUntilValid(
        'Enter year (YYYY) or -1[To go back to previous menu]: ',
        y => /^\d{4}$/.test(y)
      );
      if (year === -1) continue;

      const mIdx = monthNameToNumber(month);
      if (mIdx === null) {
        console.log('❌ Invalid month name.');
        continue;
      }

      const res = [];
      const start = new Date(Number(year), mIdx, 1);
      const end = new Date(Number(year), mIdx + 1, 0);
      let cur = new Date(start);
      while (cur <= end) {
        res.push(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 1);
      }
      return res;
    }

    console.log('❌ Invalid option.');
  }
}
async function getDDOSelection() {
  while (true) {
    console.log('\nDDO selection options:');
    console.log('[1] All DDOs');
    console.log('[2] Particular DDOs');
    console.log('[-1] To go back to starting menu');
    console.log('[-2] Quit');

    const ch = (await ask('Choose option: ')).trim();

    if (ch === '-2') return -2;
    if (ch === '-1') return -1;

    if (ch === '2') {
      const input = await ask('Enter DDO codes (comma-separated): ');
      const codes = input.split(',').map(x => x.trim()).filter(Boolean);
      const codesSet = new Set(codes);
  const count = codesSet.size;
      if (!codes.length) {
        console.log('❌ No DDOs entered.');
        continue;
      }
      return { mode: 'selected', codes: new Set(codes) ,count};
    }

    if (ch === '1') return { mode: 'all', codes: null };

    console.log('❌ Invalid option.');
  }
}

function printHeader() {
  const title = '                                     PAO DCB DOWNLOADING AUTOMATION TOOL                                                     ';
  const author = '                        DEVELOPED BY : N MEDHASHREE | BTECH STUDENT | IIIT-KOTTAYAM                                         ';

  const width = Math.max(title.length, author.length) + 8;
  const line = '='.repeat(width);

  console.log('\n' + line);
  console.log(title.padStart((width + title.length) / 2).padEnd(width));
  console.log(author.padStart((width + author.length) / 2).padEnd(width));
  console.log(line + '\n');
}

// Main
(async () => {
    printHeader();
  const bot = new PAODownloader();
  try {
    await bot.initialize();
    await bot.navigateToLogin();
    await bot.waitForEnter();
    await bot.forceDashboard();

    await bot.openPAOModule();
    await delay(800);
    await bot.clickPAOTile();
    await delay(1000);
    await bot.openVerifyDailyCashBook();
    await delay(1000);
MAIN_LOOP:
while (true) {

  // ---------- DATE MENU ----------
  const dates = await getDatesFromUser();

  if (dates === -2) {
    console.log('👋 Exiting application.');
    break;
  }

  // ---------- DDO + CONFIRMATION ----------
  while (true) {

    const ddoSelection = await getDDOSelection();

    if (ddoSelection === -2) {
      console.log('👋 Exiting application.');
      break MAIN_LOOP;
    }

    if (ddoSelection === -1) {
      // 🔙 Back to DATE menu
      break;
    }

    console.log('Dates to process:', dates);

    const proceed = (await ask(
      'Proceed with downloads? (y/n, -1 [To go back to starting menu], -2 quit): '
    )).trim().toLowerCase();

    if (proceed === '-2') {
      console.log('👋 Exiting application.');
      break MAIN_LOOP;
    }

    if (proceed === '-1' || proceed !== 'y') {
      console.log('↩ Returning to date menu.');
      break;
    }

    // ---------- PROCESS ----------
    for (const date of dates) {
      console.log(`\n==== Processing date ${date} ====`);
      await bot.enterDateAndFetch(date);
      await bot.clickReceivedCard();
      await delay(800);
      await bot.changeRowRange();
      await delay(200);

      const cnt = await bot.processAllPagesForDate(date, ddoSelection);
      console.log(`Date ${date} -> ${cnt} files processed.`);

      
      await delay(2000);
    }

    // After finishing downloads → go back to DATE menu
    break;
  }
}


    console.log('\n✅ All done. Downloads saved to:', bot.downloadPath);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    console.log('Closing browser in 5s...');
    await delay(5000);
    await bot.close();
  }
})();