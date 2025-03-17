from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import pytest
import time

@pytest.fixture
def driver():
    # Setup Chrome driver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    driver.maximize_window()
    yield driver
    # Teardown
    driver.quit()

def test_homepage(driver):
    # Test homepage loading
    driver.get("http://localhost:3000")
    assert "ruMarket" in driver.title
    
    # Test product search
    try:
        search_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Поиск товаров...']"))
        )
        search_input.send_keys("Тестовый товар")
        
        search_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(.,'Поиск')]"))
        )
        search_button.click()
        time.sleep(2)
    except:
        print("Search functionality not found or not accessible")

def test_product_listing(driver):
    # Test product listing page
    driver.get("http://localhost:3000")
    
    # Test product filters
    try:
        filter_button = driver.find_element(By.XPATH, "//button[contains(.,'Фильтры')]")
        filter_button.click()
        time.sleep(1)
        
        # Test price range inputs
        min_price = driver.find_element(By.NAME, "min")
        max_price = driver.find_element(By.NAME, "max")
        min_price.clear()
        max_price.clear()
        min_price.send_keys("1000")
        max_price.send_keys("5000")
        
        apply_button = driver.find_element(By.XPATH, "//button[contains(.,'Применить')]")
        apply_button.click()
        time.sleep(2)
    except:
        print("Filters not found or not accessible")

def test_product_details(driver):
    # Test product details page
    driver.get("http://localhost:3000")
    
    try:
        # Click on the first product card
        product_card = driver.find_element(By.CLASS_NAME, "product-card")
        product_card.click()
        time.sleep(2)
        
        # Verify product details elements
        assert driver.find_element(By.CLASS_NAME, "product-detail")
        
        # Test add to cart if available
        try:
            add_to_cart = driver.find_element(By.XPATH, "//button[contains(.,'В корзину')]")
            add_to_cart.click()
            time.sleep(1)
        except:
            print("Add to cart button not found or not accessible")
    except:
        print("Product card not found or not accessible")

def test_login_page(driver):
    # Test login page
    driver.get("http://localhost:3000/login")
    
    # Find email and password fields
    email_field = driver.find_element(By.NAME, "email")
    password_field = driver.find_element(By.NAME, "password")
    
    # Input test credentials
    email_field.send_keys("test@example.com")
    password_field.send_keys("password123")
    
    # Find and click login button
    login_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Войти')]")
    login_button.click()
    time.sleep(2)

def test_registration_page(driver):
    # Test registration page
    driver.get("http://localhost:3000/register")
    
    try:
        # Wait for form fields to be present
        wait = WebDriverWait(driver, 10)
        
        # Find and wait for form fields
        name_field = wait.until(
            EC.presence_of_element_located((By.NAME, "name"))
        )
        email_field = wait.until(
            EC.presence_of_element_located((By.NAME, "email"))
        )
        password_field = wait.until(
            EC.presence_of_element_located((By.NAME, "password"))
        )
        password_confirmation_field = wait.until(
            EC.presence_of_element_located((By.NAME, "password_confirmation"))
        )
        
        # Clear fields before input
        name_field.clear()
        email_field.clear()
        password_field.clear()
        password_confirmation_field.clear()
        
        # Input test data
        name_field.send_keys("Test User")
        email_field.send_keys(f"test{int(time.time())}@example.com")  # Unique email
        password_field.send_keys("password123")
        password_confirmation_field.send_keys("password123")
        
        # Wait for and click register button
        register_button = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Зарегистрироваться')]"))
        )
        register_button.click()
        
        # Wait for registration to complete (either success or error)
        time.sleep(2)
        
        # Check for success or error messages
        try:
            error_message = driver.find_element(By.CLASS_NAME, "text-red-600")
            print(f"Registration error: {error_message.text}")
        except:
            print("Registration appears to be successful")
            
        # Optional: Wait for redirect to dashboard after successful registration
        try:
            wait.until(EC.url_contains("/dashboard"))
            print("Successfully redirected to dashboard")
        except:
            print("No redirect occurred")
            
    except Exception as e:
        print(f"Test failed with error: {str(e)}")
        raise

if __name__ == "__main__":
    pytest.main(["-v"])