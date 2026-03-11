# Launch Assets Guide - HelpBridge

**Purpose**: Specifications for visual assets needed for launch
**Audience**: Designers, partners creating promotional materials
**Last Updated**: February 2026

---

## Overview

This guide specifies the visual assets needed for HelpBridge's launch. All assets should prioritize **accessibility**, **clarity**, and **community-centered design**.

**Design Philosophy**:

- Clean and minimal (avoid clutter)
- High contrast (accessibility requirement)
- Warm and approachable (not corporate or sterile)
- Multilingual-friendly (avoid text-heavy images)

---

## Core Brand Assets

### 1. Logo & Wordmark

#### Primary Logo (Full)

- **Components**: Icon + "HelpBridge" wordmark
- **Formats**: SVG (vector), PNG @1x, @2x, @3x
- **Variants Needed**:
  - Full color on white background
  - Full color on dark background
  - White on transparent (for dark backgrounds)
  - Black on transparent (for print)

**Size Requirements**:

- Minimum width: 120px (mobile)
- Maximum width: 400px (desktop hero)
- Maintain aspect ratio always

**Clear Space**: Minimum padding of 0.25× logo height on all sides

---

#### Icon-Only Logo (Square)

- **Use Case**: Social media profile pictures, favicons, app icons
- **Sizes Needed**:
  - 16×16px (favicon)
  - 32×32px (favicon @2x)
  - 180×180px (Apple Touch Icon)
  - 512×512px (PWA manifest icon)
  - 1024×1024px (high-res master)

**Design Note**: Icon should be recognizable even at 16×16px

---

### 2. Color Palette

#### Primary Colors

**Teal/Aqua (Primary)**

- Hex: `#4FD1C5`
- RGB: `79, 209, 197`
- Use: Primary actions, links, key UI elements
- Accessibility: ✅ Passes WCAG AA on white background

**Dark Teal (Primary Dark)**

- Hex: `#319795`
- RGB: `49, 151, 149`
- Use: Hover states, emphasis
- Accessibility: ✅ Passes WCAG AAA on white background

#### Accent Colors

**Orange (Warmth & Action)**

- Hex: `#ED8936`
- RGB: `237, 137, 54`
- Use: Call-to-action buttons, important alerts
- Accessibility: ✅ Passes WCAG AA on white background

**Red (Crisis & Urgency)**

- Hex: `#F56565`
- RGB: `245, 101, 101`
- Use: Crisis banner, emergency alerts only
- Accessibility: ✅ Passes WCAG AA on white background

#### Neutral Colors

**White**

- Hex: `#FFFFFF`
- Use: Backgrounds, cards

**Light Gray**

- Hex: `#F7FAFC`
- Use: Subtle backgrounds, dividers

**Gray**

- Hex: `#A0AEC0`
- Use: Secondary text, placeholders

**Dark Gray**

- Hex: `#2D3748`
- Use: Body text, headings

**Black**

- Hex: `#1A202C`
- Use: High-contrast text

**Color Contrast Requirements**:

- All text must meet WCAG AA (4.5:1 ratio for body, 3:1 for headings)
- All interactive elements must meet WCAG AA (3:1 ratio)

---

### 3. Typography

#### Web Typography

**Primary Font**: System Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Why System Fonts**:

- Zero load time (performance)
- Native to each OS (familiarity)
- Excellent accessibility support
- Reduces bandwidth (important for users on limited data)

#### Print/Marketing Typography

If custom fonts are needed for print materials:

- **Headings**: Inter, Poppins, or similar geometric sans-serif
- **Body**: Same as headings for consistency
- **Avoid**: Script fonts, decorative fonts (accessibility concern)

**Font Weights**:

- Regular (400): Body text
- Medium (500): Emphasis
- Semibold (600): Subheadings
- Bold (700): Headings

---

## Social Media Assets

### 1. Open Graph Images

**Purpose**: Preview images when links are shared on social media

#### Specifications

**Size**: 1200×630px
**Format**: PNG or JPG
**File Size**: <1MB (ideally <300KB)
**Safe Zone**: 1200×600px (top/bottom 15px may be cropped on some platforms)

#### Variants Needed

**Default (Homepage)**

- Content: Logo + "Find social services in Kingston, ON"
- Background: Gradient (teal to white) or solid teal
- Text: White, large, bold
- URL: "helpbridge.ca" in bottom-right corner

**Service Page**

- Content: "Social Services in Kingston" + category icon
- Background: Consistent with homepage
- Dynamic: If possible, generate per-category

**Generic**

- Content: Logo + tagline
- Use: Fallback for all pages without custom OG image

#### Design Checklist

- [ ] Text readable at thumbnail size (300×157px preview)
- [ ] High contrast (readable on mobile)
- [ ] Logo visible
- [ ] URL included
- [ ] Branded but not cluttered

---

### 2. Social Media Profile Graphics

#### Profile Pictures

**Platforms**: Twitter, Facebook, Instagram, LinkedIn
**Size**: 400×400px (square)
**Content**: Icon-only logo or circular logo variant
**Format**: PNG with transparency (if supported)

**Platform-Specific Sizes**:

- Twitter: 400×400px (displays as 200×200px)
- Facebook: 180×180px (displays as 170×170px)
- Instagram: 320×320px (displays as 110×110px)
- LinkedIn: 400×400px (displays as 300×300px)

#### Cover Photos

**Twitter Header**

- Size: 1500×500px
- Safe zone: Center 1200×400px (edges may be cropped)
- Content: Tagline + key features + URL
- Design: Clean, not too busy

**Facebook Cover**

- Size: 820×312px
- Safe zone: Center 640×312px
- Content: Similar to Twitter header

**LinkedIn Banner**

- Size: 1584×396px
- Safe zone: Center 1350×350px
- Content: Professional version (data-driven, impact-focused)

---

### 3. Instagram Graphics

#### Feed Posts (Square)

**Size**: 1080×1080px
**Format**: PNG or JPG
**Quantity**: 10-15 reusable templates

**Template Types**:

1. **Announcement** - Bold headline + logo
2. **Feature Highlight** - Icon + description + screenshot
3. **Statistic** - Large number + context
4. **Testimonial** - Quote + attribution
5. **Tip/How-To** - Step-by-step or quick tip
6. **Crisis Resource** - Emergency contact info (988, etc.)

**Design Consistency**:

- Use brand color palette
- Consistent font sizing
- Logo watermark in corner
- URL at bottom

#### Stories

**Size**: 1080×1920px (9:16 ratio)
**Safe Zone**: 1080×1680px (top/bottom may have UI overlays)
**Quantity**: 5-10 reusable templates

**Template Types**:

1. **Poll/Quiz** - Engagement driver
2. **Quick Tip** - Swipeable info cards
3. **Behind-the-Scenes** - Development/curation process
4. **Feature Demo** - Animated walkthrough
5. **Call-to-Action** - "Swipe up" or "Link in bio"

---

### 4. Carousel Graphics

**Instagram Carousels** (Multiple images in one post)

**Size**: 1080×1080px per slide
**Quantity**: 10-20 slides total (2-4 carousels)
**Slide Count**: 4-10 slides per carousel

**Carousel Topics**:

1. **How It Works** (5 slides)
   - Slide 1: Title "How HelpBridge Works"
   - Slide 2: "1. Search"
   - Slide 3: "2. Browse Results"
   - Slide 4: "3. View Details"
   - Slide 5: "4. Get Help"

2. **Features** (5 slides)
   - Privacy-first
   - Works offline
   - 7 languages
   - Crisis support
   - Accessibility

3. **Service Categories** (10 slides)
   - One slide per category (Food, Crisis, Housing, etc.)

**Design Consistency**:

- Numbered slides (1/5, 2/5, etc.)
- Arrow or swipe indicator
- Consistent color scheme across slides
- Logo on first and last slide

---

## Website Graphics

### 1. Hero Image / Illustration

**Purpose**: Homepage above-the-fold visual

**Option A: Illustration**

- Style: Flat, modern, inclusive
- Content: Diverse people helping each other, connecting, or searching
- Colors: Brand palette (teal, orange, neutrals)
- Size: 1200×800px (responsive)
- Format: SVG (preferred for crisp scaling) or PNG @2x

**Option B: Abstract Pattern**

- Style: Geometric, flowing, organic
- Colors: Brand palette gradient
- Use: Background element, not primary focus

**Avoid**:

- Stock photos of people (feels impersonal)
- Crisis imagery (triggering for users in crisis)
- Corporate/professional photography (too formal)

---

### 2. Feature Icons

**Quantity**: 6-10 icons
**Size**: 64×64px (display), 128×128px (source)
**Style**: Line icons or filled, consistent stroke width
**Format**: SVG (preferred) or PNG @2x

**Icons Needed**:

1. **Search** - Magnifying glass
2. **Offline** - Phone with wifi-off or download icon
3. **Languages** - Globe or speech bubbles
4. **Privacy** - Lock or shield
5. **Accessibility** - Accessibility symbol (⚿)
6. **Crisis** - Heart or helping hands
7. **Location** - Map pin
8. **Verified** - Checkmark or badge

**Design Specs**:

- Stroke width: 2px
- Corner radius: 2px (if rounded)
- Monochrome (single color, use CSS for theming)
- Simple and recognizable at small sizes

---

### 3. Category Icons

**Quantity**: 15 icons (one per service category)
**Size**: 48×48px (display), 96×96px (source)
**Style**: Filled or outline, consistent with feature icons
**Format**: SVG or PNG @2x

**Categories**:

1. Food (utensils or apple)
2. Crisis (lifebuoy or phone)
3. Housing (house or key)
4. Mental Health (brain or heart with pulse)
5. Addiction (hands holding or support symbol)
6. Health (medical cross or heart)
7. Legal (scales or document)
8. Employment (briefcase or person with gear)
9. Family (people or heart)
10. Youth (child or backpack)
11. Seniors (elder or cane)
12. Disabilities (accessibility symbol)
13. Indigenous (feather or circle - **consult with Indigenous advisors**)
14. Financial (dollar sign or coins)
15. Transport (bus or car)

**Cultural Sensitivity Note**:
Indigenous icon must be designed in consultation with Indigenous community members or use widely-accepted accessibility symbols.

---

### 4. Screenshots

**Purpose**: Documentation, press kit, social media

**Quantity**: 6-10 high-quality screenshots
**Format**: PNG
**Resolution**: Retina (2x or 3x)

**Screenshots Needed**:

1. **Homepage** - Clean search interface
2. **Search Results** - Food bank example
3. **Service Detail** - Complete service page
4. **Crisis Banner** - Example of crisis detection
5. **Language Selector** - Showing 7 languages
6. **Mobile View** - Responsive design (iPhone, Android)
7. **Offline Mode** - PWA offline functionality
8. **Accessibility** - Keyboard navigation or screen reader

**Capture Guidelines**:

- Use realistic demo data (not lorem ipsum)
- Clean browser chrome (no bookmarks bar, etc.)
- Consistent screen size across shots
- High resolution (2560×1600 or higher)

**Post-Processing**:

- Add device frame (optional, for marketing)
- Slight shadow for depth (optional)
- Annotations (arrows, highlights) if used in tutorials

---

## Print Materials

### 1. Business Cards (If Needed)

**Size**: 3.5″ × 2″ (standard US) or 85mm × 55mm (Europe/Canada)
**Format**: PDF (print-ready, CMYK color mode)
**Bleed**: 0.125″ (3mm) on all sides

**Front**:

- Logo
- "helpbridge.ca"
- Tagline: "Find social services in Kingston, ON"

**Back**:

- Contact email: feedback@helpbridge.ca
- QR code linking to helpbridge.ca (optional)
- 7-language support icons or flags

**Print Specs**:

- Color mode: CMYK (not RGB)
- Resolution: 300 DPI minimum
- Font embedding: Required

---

### 2. Posters / Flyers (Community Distribution)

**Sizes**:

- Letter: 8.5″ × 11″ (for easy printing/posting)
- Tabloid: 11″ × 17″ (for community boards)

**Content**:

- Large QR code (easy to scan from distance)
- "Find social services in Kingston"
- Key features (icons + text)
- URL: helpbridge.ca
- Available in 7 languages

**Accessibility Requirements**:

- Minimum font size: 14pt (for readability)
- High contrast (black text on white, or white text on dark teal)
- Simple layout (avoid busy backgrounds)
- Large QR code (2″ × 2″ minimum)

**Print Versions**:

- Color (for professional printing)
- Black & white (for photocopying)

**Distribution Locations**:

- Community centers
- Libraries
- Social service agency waiting rooms
- Bus shelters (if permitted)
- Food banks
- Health clinics

---

### 3. Rack Cards (Vertical Handouts)

**Size**: 4″ × 9″ (standard rack card)
**Format**: PDF (print-ready, CMYK)

**Content** (Single-sided or double-sided):

- Front: Logo, QR code, URL, tagline
- Back: 3-5 key features, multilingual indicator, contact info

**Use Case**: Stack at community centers, libraries, service provider offices

---

## Launch Event Materials (If Applicable)

### 1. Presentation Slides

**Format**: PowerPoint (.pptx) or Google Slides
**Aspect Ratio**: 16:9 (widescreen)
**Slide Count**: 10-15 slides

**Slide Deck Structure**:

1. Title slide (logo, date, event)
2. Problem statement (why we built this)
3. Solution overview (what it is)
4. Key features (privacy, offline, languages)
5. Demo (live or video)
6. Impact metrics (services listed, languages supported)
7. Roadmap (beta → public launch)
8. Call to action (try it, share it, partner with us)
9. Q&A
10. Thank you + contact info

**Design Specs**:

- Minimal text (20-word max per slide)
- Large, readable fonts (24pt minimum)
- High-contrast (light background, dark text)
- Consistent branding (logo on every slide)

---

### 2. Demo Video (Optional)

**Purpose**: Show how to use HelpBridge in 60-90 seconds

**Specifications**:

- Resolution: 1920×1080px (1080p)
- Format: MP4 (H.264 codec)
- Length: 60-90 seconds
- Aspect Ratio: 16:9 (landscape) or 9:16 (vertical for social)

**Script Outline**:

1. (0-10s) Show problem: "Need help finding a food bank?"
2. (10-20s) Show homepage: "HelpBridge is here to help."
3. (20-40s) Demo search: Type "food bank" → results appear
4. (40-60s) Demo service detail: Click result → see full info
5. (60-75s) Highlight features: Works offline, 7 languages, privacy-first
6. (75-90s) Call to action: "Visit helpbridge.ca"

**Production Notes**:

- Screen recording of actual app (not animation)
- Smooth cursor movement
- Realistic search queries
- Voiceover (calm, clear, empathetic) or text captions
- Background music (soft, non-intrusive)
- Captions/subtitles (accessibility requirement)

**Distribution**:

- Website homepage
- YouTube
- Social media (Twitter, Facebook, Instagram Reels)
- Email to beta testers

---

## File Naming Conventions

**Format**: `helpbridge-[type]-[variant]-[size].[ext]`

**Examples**:

- `helpbridge-logo-full-color-400px.png`
- `helpbridge-logo-icon-white-512px.svg`
- `helpbridge-og-image-homepage-1200x630.png`
- `helpbridge-social-twitter-header-1500x500.jpg`
- `helpbridge-icon-search-64px.svg`
- `helpbridge-screenshot-mobile-iphone-2x.png`

**Benefits**:

- Easy to find specific assets
- Version control friendly
- Clear at a glance what each file is

---

## Accessibility Checklist for All Graphics

Before finalizing any graphic asset:

- [ ] **Color Contrast**: All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- [ ] **Alt Text Ready**: Image has descriptive alt text (or design allows for it)
- [ ] **Readable at Small Sizes**: Icons recognizable at 16×16px, text readable at thumbnail
- [ ] **No Text in Images** (when avoidable): Use HTML/CSS text instead for accessibility
- [ ] **Culturally Sensitive**: Icons and imagery reviewed for cultural appropriateness
- [ ] **Gender Neutral**: Avoid gendered imagery or language unless contextually necessary
- [ ] **Inclusive**: Diverse representation when showing people

---

## Asset Creation Tools (Free Options)

### Design Tools

- **Figma** (free tier): UI design, prototyping, collaboration
- **Canva** (free tier): Social media graphics, posters
- **Inkscape** (free, open-source): Vector graphics (SVG)
- **GIMP** (free, open-source): Raster graphics (PNG, JPG)

### Icon Resources

- **Heroicons** (free, MIT license): Consistent icon set
- **Lucide** (free, open-source): Icon library (what we use in app)
- **Phosphor Icons** (free): Modern icon set

### Color Tools

- **Coolors.co**: Palette generation
- **WebAIM Contrast Checker**: WCAG compliance verification
- **Adobe Color**: Color harmony and accessibility

### Stock Photos (if needed)

- **Unsplash** (free): High-quality photography
- **Pexels** (free): Diverse stock photos
- **Pixabay** (free): Public domain images

**Recommendation**: Use illustrations over stock photos for brand consistency and inclusivity.

---

## Delivery Specifications

When assets are created, deliver in this structure:

```
helpbridge-ca-assets/
├── logos/
│   ├── svg/
│   │   ├── helpbridge-logo-full-color.svg
│   │   ├── helpbridge-logo-white.svg
│   │   └── helpbridge-icon-only.svg
│   └── png/
│       ├── helpbridge-logo-full-color-400px.png
│       ├── helpbridge-logo-full-color-800px.png
│       └── helpbridge-icon-512px.png
├── social/
│   ├── og-images/
│   │   ├── helpbridge-og-homepage.png
│   │   └── helpbridge-og-generic.png
│   ├── profile/
│   │   ├── helpbridge-profile-twitter-400x400.png
│   │   └── helpbridge-profile-linkedin-400x400.png
│   └── covers/
│       ├── helpbridge-twitter-header-1500x500.jpg
│       └── helpbridge-facebook-cover-820x312.jpg
├── icons/
│   ├── features/
│   │   ├── helpbridge-icon-search.svg
│   │   ├── helpbridge-icon-offline.svg
│   │   └── ...
│   └── categories/
│       ├── helpbridge-icon-food.svg
│       ├── helpbridge-icon-crisis.svg
│       └── ...
├── print/
│   ├── helpbridge-poster-letter.pdf
│   ├── helpbridge-poster-tabloid.pdf
│   └── helpbridge-rack-card.pdf
└── video/
    └── helpbridge-demo-60s.mp4
```

**Delivery Format**: ZIP file or shared Google Drive/Dropbox folder

---

## Timeline & Prioritization

### Critical (Needed Before Beta Launch)

- [ ] Logo (SVG + PNG variants)
- [ ] Favicon (16×16, 32×32)
- [ ] Open Graph image (homepage)
- [ ] Social media profile pictures

**Deadline**: 1 week before beta launch

### Important (Needed Before Public Launch)

- [ ] Feature icons (6-10)
- [ ] Category icons (15)
- [ ] Social media covers
- [ ] Instagram graphics (5-10 templates)

**Deadline**: 1 week before public launch

### Nice-to-Have (Post-Launch)

- [ ] Print materials (posters, flyers)
- [ ] Demo video
- [ ] Carousel graphics
- [ ] Instagram Stories templates

**Deadline**: 2-4 weeks after public launch

---

## Budget Considerations

### DIY (Free)

- **Time**: 10-20 hours
- **Tools**: Figma, Canva, Inkscape
- **Quality**: Good for MVP, may need refinement

### Freelancer ($500-$2,000)

- **Time**: 2-3 weeks
- **Platforms**: Fiverr, Upwork, 99designs
- **Quality**: Professional, tailored

### Agency ($5,000-$20,000)

- **Time**: 4-8 weeks
- **Scope**: Full brand identity, style guide, assets
- **Quality**: Premium, comprehensive

**Recommendation**: Start with DIY or freelancer for beta launch, invest in agency if project scales.

---

## Contact & Questions

For questions about asset specifications:
**Email**: feedback@helpbridge.ca

For design collaboration or asset delivery:
**Email**: feedback@helpbridge.ca

---

**Document Version**: 1.0
**Last Updated**: February 10, 2026
**Next Review**: After beta launch (March 2026)
