from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import pytest
import time

SELECTORS = {
    # Login page selectors
    'email_input': "//input[@name='email']",
    'password_input': "//input[@name='password']",
    'login_button': "//button[@type='submit']",
    
    # Updated search functionality selectors with multiple possible matches
    'search_input': "//input[@type='text' or @type='search'][contains(@class, 'search') or contains(@placeholder, 'Search') or contains(@placeholder, 'Поиск')]",
    'search_button': "//button[contains(@class, 'search') or @aria-label='Search' or contains(@type, 'submit')]",
    
    # Rest of the selectors remain the same
    'product_card': "//div[contains(@class, 'group')]//div[contains(@class, 'relative')]",
    'add_to_cart_button': "//button[contains(text(), 'В корзину')]",
    'add_to_favorites_button': "//button[@aria-label='Add to favorites']",
    'cart_icon': "//a[@href='/cart']//span[contains(@class, 'sr-only')]",
    'cart_item': "//div[contains(@class, 'cart-items')]//div[contains(@class, 'flex')]",
    'dashboard_welcome': "//div[contains(@class, 'py-12')]//h2",
    'orders_section': "//a[@href='/dashboard/orders']",
    'favorites_section': "//a[@href='/dashboard/favorites']",
    'profile_section': "//a[@href='/dashboard/profile']"
}

class TestE2E:
    @pytest.fixture(scope="class")
    def driver(self):
        service = Service(ChromeDriverManager().install())
        options = webdriver.ChromeOptions()
        options.add_argument("--disable-notifications")
        options.add_argument("--start-maximized")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--remote-debugging-port=9222")
        driver = webdriver.Chrome(service=service, options=options)
        yield driver
        driver.quit()

    def wait_and_click(self, driver, selector, timeout=10):
        try:
            element = WebDriverWait(driver, timeout).until(
                EC.element_to_be_clickable((By.XPATH, selector))
            )
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element)
            time.sleep(2)
            driver.execute_script("arguments[0].click();", element)
            return element
        except Exception as e:
            print(f"Failed to click element with selector: {selector}")
            driver.save_screenshot(f"click_error_{time.time()}.png")
            raise e

    def wait_and_send_keys(self, driver, selector, keys, timeout=10):
        try:
            print(f"\nLooking for element with selector: {selector}")
            print("Current URL:", driver.current_url)
            print("Current page source:")
            print(driver.page_source[:1000])  # Increased to show more context
            
            # Wait for page to be fully loaded
            WebDriverWait(driver, timeout).until(
                lambda d: d.execute_script('return document.readyState') == 'complete'
            )
            
            element = WebDriverWait(driver, timeout).until(
                EC.presence_of_element_located((By.XPATH, selector))
            )
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element)
            time.sleep(2)  # Increased wait time after scrolling
            element.clear()
            element.send_keys(keys)
            return element
        except Exception as e:
            print(f"Failed to send keys to element with selector: {selector}")
            print(f"Current URL: {driver.current_url}")
            print("Available elements:")
            print(driver.find_elements(By.XPATH, "//*[@type='text' or @type='search']"))
            driver.save_screenshot(f"sendkeys_error_{time.time()}.png")
            raise e

    def test_full_flow(self, driver):
        try:
            # 1. Login
            print("Testing login...")
            driver.get("http://localhost:3000/login")
            time.sleep(3)
            
            self.wait_and_send_keys(driver, SELECTORS['email_input'], "test@example.com")
            self.wait_and_send_keys(driver, SELECTORS['password_input'], "password123")
            self.wait_and_click(driver, SELECTORS['login_button'])
            
            # Wait for login to complete and verify we're logged in
            time.sleep(5)  # Increased wait time for login processing
            
            # Check if we're redirected to dashboard or home
            current_url = driver.current_url
            if not (current_url.endswith('/dashboard') or current_url == 'http://localhost:3000/'):
                raise Exception(f"Login failed. Current URL: {current_url}")
            
            # Navigate to home page
            driver.get("http://localhost:3000")
            time.sleep(3)
            
            # 2. Search for product
            print("Testing search...")
            search_input = self.wait_and_send_keys(driver, SELECTORS['search_input'], "Ноутбук ASUS ROG Strix G15")
            if not search_input:
                raise Exception("Search input not found")
            
            self.wait_and_click(driver, SELECTORS['search_button'])
            time.sleep(3)
            
            # 3. Add product to cart
            print("Testing add to cart...")
            self.wait_and_click(driver, SELECTORS['product_card'])
            time.sleep(2)
            self.wait_and_click(driver, SELECTORS['add_to_cart_button'])
            time.sleep(2)
            
            # 4. Add to favorites
            print("Testing favorites...")
            self.wait_and_click(driver, SELECTORS['add_to_favorites_button'])
            time.sleep(2)
            
            # 5. Check cart
            print("Testing cart...")
            self.wait_and_click(driver, SELECTORS['cart_icon'])
            time.sleep(2)
            
            # Verify cart item exists
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, SELECTORS['cart_item']))
            )
            
            # 6. Check dashboard
            print("Testing dashboard...")
            driver.get("http://localhost:3000/dashboard")
            time.sleep(3)
            
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, SELECTORS['dashboard_welcome']))
            )
            
            # Test dashboard sections
            sections = ['orders_section', 'favorites_section', 'profile_section']
            for section in sections:
                print(f"Testing {section}...")
                self.wait_and_click(driver, SELECTORS[section])
                time.sleep(2)
            
            print("All tests completed successfully!")
            
        except Exception as e:
            print(f"Test failed: {str(e)}")
            driver.save_screenshot("error_screenshot.png")
            raise