# Pre-deployment checklist

## Before uploading
- [ ] Update SMTP credentials in `assets/php/mail-config.local.php` (do NOT commit this file)
- [x] GA4 ID set to `G-136LRTKTFB` in `assets/js/cookie-consent.js`
- [ ] Replace Google Maps embed `src` with your real API embed URL (all 3 contact pages)
- [ ] Add real product photos to `assets/images/products/{id}/main.jpg`
- [ ] Add real team photos to `assets/images/team/`
- [ ] Add real OG image to `assets/images/og-image.jpg` (1200x630)
- [ ] Test contact form locally (PHP dev server: `php -S localhost:8000`)
- [ ] Verify all 36 product detail pages load correctly
- [ ] Check browser console — zero 404 errors on images/scripts/CSS

## On Hostpoint panel (before or after upload)
- [ ] Enable SSL/TLS — Let's Encrypt for rubbermats.ch
- [ ] Confirm PHP version >= 7.4 (for PHPMailer)
- [ ] Note FTP credentials (Host / User / Pass / Remote dir)
- [ ] Set SMTP credentials in environment variables if supported, or in `mail-config.local.php`
- [ ] Ensure `mod_rewrite` is enabled (usually default on Hostpoint)

## FTP upload
```bash
# Option A: lftp (Linux/macOS/WSL)
FTP_HOST=ftp.hostpoint.ch FTP_USER=xxx FTP_PASS=xxx bash deploy/deploy.sh

# Option B: WinSCP (Windows PowerShell)
$env:FTP_HOST="ftp.hostpoint.ch"; $env:FTP_USER="xxx"; $env:FTP_PASS="xxx"
.\deploy\deploy.ps1

# Option C: FileZilla manual upload
# Exclude: litho-template/, .git/, node_modules/, deploy/, *.md
```

## After uploading
- [ ] Visit https://rubbermats.ch — confirm redirect to /fr/
- [ ] Confirm HTTPS works (no mixed content warnings)
- [ ] Test language switcher: FR -> DE -> EN on all page types
- [ ] Submit contact form — confirm email arrives at info@rubbermats.ch
- [ ] Click "Demander un devis" from a product detail page — confirm product field pre-fills
- [ ] Accept cookies — confirm Google Maps loads on contact page
- [ ] Check old URLs redirect: /products.html -> /fr/produits.html
- [ ] Visit /nonexistent-page — confirm 404 page shows
- [ ] Run https://validator.w3.org on homepage
- [ ] Run https://search.google.com/test/rich-results on homepage (JSON-LD check)
- [ ] Run https://pagespeed.web.dev on homepage
- [ ] Submit sitemap.xml to Google Search Console
