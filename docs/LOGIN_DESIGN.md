# Login page design

The `/login` page follows the supplied purple split-screen reference. Its dedicated full-width route layout preserves the split screen on desktop and tablet, including after logout. It uses a single-column form below 768px. Existing email/password authentication, remember-me storage, validation, verification notices, registration, and password reset are preserved. Google and Microsoft buttons are disabled with a visible availability note because this frontend has no social authentication integration.

## Illustration

- Project asset: `src/assets/royal-blue-support.webp`.
- User-supplied original: `src/assets/Royal Blue Hoodie Tech Workspace.png`. The original is preserved. The built-in imagegen tool removes its black backdrop for display over the purple panel; the page uses a WebP copy of the cutout at quality 0.9.
- Desktop, laptop, and mobile previews: `docs/previews/login-*.png`.

Background-extraction prompt:

> Use case: background-extraction. Edit target: the supplied Royal Blue Hoodie Tech Workspace.png image. Remove only the solid black background, replacing it with genuinely transparent alpha. Preserve the entire original illustration exactly: same adult man's face, glasses, dark hair and beard, expression, pose, royal blue hoodie, purple/white headset, laptop, potted plant, mug, desk and floating notification, ticket/check and bar chart objects. Preserve exact original composition, proportions, colors, materials, textures, lighting, object edges, and full framing. Do not redraw, redesign, recolor, crop, add or remove any foreground objects. Black and dark colors inside the man's hair, glasses, face details and object shadows must remain intact. Only the external connected black backdrop becomes transparent. Output a clean cutout with no black rectangle, no added text or watermark, for display over a violet login-page panel.

### Previous illustration

`src/assets/login-support.webp` (approximately 212 KB) was created with the built-in imagegen tool and is no longer used by the login page.

Previous generation prompt:

> Use case: stylized-concept. Asset type: transparent hero illustration for an existing corporate helpdesk login page. Create one polished friendly 3D clay-style illustration on genuinely transparent background, wide landscape composition about 3:2: a smiling young male support agent with wavy dark brown hair wearing a violet blue hoodie and over-ear white and lavender headset with microphone, seated at a desk using a violet laptop with a simple white headset symbol on its lid. Small green potted plant at left and white coffee cup at right. Above and to the right float three small glossy white-lavender UI objects: notification bell with orange bell and tiny red dot, support-ticket bubble with purple abstract lines and green check, and small purple bar chart bubble. Soft rounded toy-like forms, premium clean 3D render, soft studio lighting, violet-blue reflected light, restrained shadows. Front three-quarter view. All objects entirely in frame, agent centered slightly right, desk along lower edge. No text, no letters, no watermark, no background panel. Designed to sit on a vivid purple gradient panel. Illustration only, not a screenshot or web page.
