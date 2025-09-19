<!-- Meta CAPI Advanced Tracking with Full Data Enrichment -->
<script>
(function() {
    // ========== CONFIGURATION ==========
    const CAPI_ENDPOINT = 'https://metacapiv2.vercel.app/api';
    const DEBUG = true; // Set false in production
    
    // ========== FACEBOOK COOKIE HANDLERS ==========
    
    /**
     * Get Facebook Click ID (_fbc cookie)
     * Format: fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
     */
    function getFBC() {
        // First try to get from cookie
        let fbc = getCookie('_fbc');
        
        // If no cookie, try to generate from URL parameter fbclid
        if (!fbc) {
            const urlParams = new URLSearchParams(window.location.search);
            const fbclid = urlParams.get('fbclid');
            
            if (fbclid) {
                // Generate fbc value
                const timestamp = Date.now();
                fbc = `fb.1.${timestamp}.${fbclid}`;
                
                // Store in cookie for 90 days
                setCookie('_fbc', fbc, 90);
            }
        }
        
        return fbc;
    }
    
    /**
     * Get Facebook Pixel ID (_fbp cookie)
     * Format: fb.1.1596403881668.1116446470
     */
    function getFBP() {
        let fbp = getCookie('_fbp');
        
        // If no cookie exists, generate one
        if (!fbp) {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 15);
            fbp = `fb.1.${timestamp}.${random}`;
            
            // Store in cookie for 90 days
            setCookie('_fbp', fbp, 90);
        }
        
        return fbp;
    }
    
    /**
     * Cookie helper functions
     */
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    function setCookie(name, value, days) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${value}; expires=${expires}; path=/; domain=${window.location.hostname}`;
    }
    
    // ========== ENHANCED DATA COLLECTION ==========
    
    /**
     * Collect all available user data for better matching
     */
    function collectUserData() {
        return {
            fbp: getFBP(),                    // Facebook Pixel ID
            fbc: getFBC(),                    // Facebook Click ID
            user_agent: navigator.userAgent,  // Browser info
            screen_resolution: `${screen.width}x${screen.height}`,
            language: navigator.language,
            referrer: document.referrer,
            page_title: document.title,
            source_url: window.location.href
        };
    }
    
    // ========== TRACK VIEW CONTENT (PAGE VIEW) ==========
    
    window.addEventListener('load', function() {
        const userData = collectUserData();
        
        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', 'ViewContent', {
                content_name: document.title,
                content_type: 'landing_page',
                value: 0.00,
                currency: 'USD'
            });
        }
        
        // Send to CAPI with enriched data
        fetch(CAPI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_name: 'ViewContent',
                event_source_url: window.location.href,
                user_agent: userData.user_agent,
                fbp: userData.fbp,  // Include Facebook Pixel ID
                fbc: userData.fbc,  // Include Facebook Click ID
                custom_data: {
                    page_title: userData.page_title,
                    referrer: userData.referrer
                }
            })
        }).then(response => response.json())
          .then(data => {
              if (DEBUG) console.log('✅ ViewContent tracked:', data);
          })
          .catch(error => {
              if (DEBUG) console.error('❌ CAPI Error:', error);
          });
    });
    
    // ========== TRACK LEAD EVENTS (CLICKS) ==========
    
    document.addEventListener('DOMContentLoaded', function() {
        // Wait for dynamic content to load
        setTimeout(function() {
            
            // ===== 1. WHATSAPP TRACKING =====
            // This finds ALL WhatsApp links and buttons
            const whatsappSelectors = [
                'a[href*="wa.me"]',           // wa.me/123456789
                'a[href*="whatsapp.com"]',    // api.whatsapp.com/send
                'a[href*="whatsapp://"]',     // whatsapp:// protocol
                '.altumcode-whatsapp-chat-window-footer-button', // Your widget button
                '.altumcode-whatsapp-chat-wrapper',              // Your widget wrapper
                '[href*="api.whatsapp.com"]'                     // API links
            ];
            
            document.querySelectorAll(whatsappSelectors.join(', ')).forEach(function(element) {
                // Attach click listener to each WhatsApp element
                element.addEventListener('click', function(e) {
                    const clickData = {
                        type: 'WhatsApp',
                        text: this.innerText || this.getAttribute('aria-label') || 'WhatsApp Chat',
                        url: this.href || 'WhatsApp Widget',
                        element_id: this.id || null,
                        element_class: this.className || null
                    };
                    
                    trackLead('WhatsApp', clickData);
                    
                    if (DEBUG) {
                        console.log('🟢 WhatsApp clicked:', clickData);
                    }
                });
            });
            
            // ===== 2. PHONE CALL TRACKING =====
            // This finds ALL phone links
            const phoneSelectors = [
                'a[href^="tel:"]',            // tel:+201119907377
                '.call-button',                // Your call button class
                'a[href^="phone:"]',          // phone: protocol
                '[onclick*="tel:"]'           // Inline onclick with tel
            ];
            
            document.querySelectorAll(phoneSelectors.join(', ')).forEach(function(element) {
                element.addEventListener('click', function(e) {
                    // Extract phone number
                    let phoneNumber = '';
                    if (this.href && this.href.includes('tel:')) {
                        phoneNumber = this.href.replace('tel:', '').replace('phone:', '');
                    } else {
                        phoneNumber = this.innerText || 'Phone Call';
                    }
                    
                    const clickData = {
                        type: 'Phone',
                        phone_number: phoneNumber,
                        text: this.innerText || phoneNumber,
                        element_id: this.id || null
                    };
                    
                    trackLead('Phone', clickData);
                    
                    if (DEBUG) {
                        console.log('📞 Phone clicked:', clickData);
                    }
                });
            });
            
            // ===== 3. CTA BUTTON TRACKING =====
            // Your specific button IDs from the landing page
            const ctaSelectors = [
                '#biolink_block_id_783',      // WhatsApp Me Now button
                '#biolink_block_id_791',      // Call Me Now button  
                '#biolink_block_id_782',      // Bottom WhatsApp button
                '.cta-button',                // Generic CTA buttons
                '.btn-primary',               // Primary buttons
                '.btn-success',               // Success buttons
                '[data-track="lead"]',        // Custom tracking attribute
                'button[type="submit"]'       // Form submit buttons
            ];
            
            document.querySelectorAll(ctaSelectors.join(', ')).forEach(function(element) {
                // Skip if already tracked as WhatsApp or Phone
                if (!element.hasAttribute('data-tracked')) {
                    element.setAttribute('data-tracked', 'true');
                    
                    element.addEventListener('click', function(e) {
                        const clickData = {
                            type: 'CTA Button',
                            text: this.innerText || 'Button Click',
                            button_id: this.id || null,
                            button_class: this.className || null,
                            href: this.href || null
                        };
                        
                        trackLead('CTA', clickData);
                        
                        if (DEBUG) {
                            console.log('🎯 CTA clicked:', clickData);
                        }
                    });
                }
            });
            
            // ===== 4. FLOATING WIDGET TRACKING =====
            // Special handling for the floating WhatsApp widget
            const floatingWidget = document.querySelector('.altumcode');
            if (floatingWidget) {
                // Track when widget is opened
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.target.classList.contains('altumcode-shown')) {
                            trackLead('WhatsApp Widget', {
                                type: 'Widget Opened',
                                action: 'opened'
                            });
                        }
                    });
                });
                
                observer.observe(floatingWidget, {
                    attributes: true,
                    attributeFilter: ['class']
                });
            }
            
            // Log tracking summary
            if (DEBUG) {
                const totalTracked = 
                    document.querySelectorAll(whatsappSelectors.join(', ')).length +
                    document.querySelectorAll(phoneSelectors.join(', ')).length +
                    document.querySelectorAll(ctaSelectors.join(', ')).length;
                
                console.log(`
                    ✅ Meta CAPI Tracking Active
                    📊 Tracking ${totalTracked} total elements:
                    - WhatsApp: ${document.querySelectorAll(whatsappSelectors.join(', ')).length}
                    - Phone: ${document.querySelectorAll(phoneSelectors.join(', ')).length}
                    - CTA: ${document.querySelectorAll(ctaSelectors.join(', ')).length}
                    🍪 FBP: ${getFBP()}
                    🍪 FBC: ${getFBC() || 'Not set (no fbclid parameter)'}
                `);
            }
            
        }, 2000); // Wait 2 seconds for dynamic content
    });
    
    // ========== MAIN LEAD TRACKING FUNCTION ==========
    
    function trackLead(type, clickData) {
        const userData = collectUserData();
        
        // Facebook Pixel with enhanced data
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead', {
                content_name: clickData.text || type,
                content_category: type,
                lead_type: type.toLowerCase().replace(' ', '_'),
                value: 1.00,
                currency: 'USD'
            });
        }
        
        // Send to CAPI with full enriched data
        const eventData = {
            event_name: 'Lead',
            event_source_url: window.location.href,
            user_agent: userData.user_agent,
            fbp: userData.fbp,  // Facebook Pixel ID cookie
            fbc: userData.fbc,  // Facebook Click ID cookie
            custom_data: {
                lead_type: type,
                click_details: clickData,
                page_data: {
                    title: userData.page_title,
                    referrer: userData.referrer,
                    screen: userData.screen_resolution,
                    language: userData.language
                },
                timestamp: new Date().toISOString()
            }
        };
        
        // Use sendBeacon for reliability when leaving page
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(eventData)], { type: 'application/json' });
            navigator.sendBeacon(CAPI_ENDPOINT, blob);
            
            if (DEBUG) console.log('📤 Lead sent via sendBeacon');
        } else {
            // Fallback to fetch
            fetch(CAPI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData),
                keepalive: true
            }).then(response => response.json())
              .then(data => {
                  if (DEBUG) console.log('✅ Lead tracked:', data);
              })
              .catch(error => {
                  if (DEBUG) console.error('❌ Error:', error);
              });
        }
    }
    
})();
</script>
