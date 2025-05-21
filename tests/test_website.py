from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import pytest
import time
import random

# Тестовые учетные данные
TEST_EMAIL = f"test{random.randint(1000, 9999)}@mail.ru"
TEST_PASSWORD = "Test123!"
TEST_PHONE = f"+7{random.randint(900, 999)}{random.randint(1000000, 9999999)}"

SELECTORS = {
    'email_input': "//input[@name='email']",
    'password_input': "//input[@name='password']",
    'login_button': "//button[@type='submit']",
    
    'search_input': "//input[@type='text' or @type='search'][contains(@class, 'search') or contains(@placeholder, 'Search') or contains(@placeholder, 'Поиск')]",
    'search_button': "//button[contains(@class, 'search') or @aria-label='Search' or contains(@type, 'submit')]",
    
    'product_card': "//div[contains(@class, 'group')]//div[contains(@class, 'relative')]",
    'add_to_cart_button': "//button[.//span[contains(text(), 'В корзину')]]",
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
            print(f"Не удалось кликнуть по элементу с селектором: {selector}")
            driver.save_screenshot(f"click_error_{time.time()}.png")
            raise e

    def wait_for_redirects(self, driver, timeout=10):
        try:
            WebDriverWait(driver, timeout).until(
                lambda d: d.execute_script('return document.readyState') == 'complete'
            )
            initial_url = driver.current_url
            
            def url_has_stabilized(d):  # Add driver parameter
                time.sleep(1)
                current_url = d.current_url
                if current_url != initial_url:
                    return False
                return d.execute_script('return document.readyState') == 'complete'
            
            WebDriverWait(driver, timeout).until(url_has_stabilized)
            time.sleep(2)
                
        except Exception as e:
            print(f"Warning: Redirect wait timeout - {str(e)}")

    def wait_and_send_keys(self, driver, selector, keys, timeout=10):
        try:
            # Ожидание полной загрузки страницы
            WebDriverWait(driver, timeout).until(
                lambda d: d.execute_script('return document.readyState') == 'complete'
            )
            
            element = WebDriverWait(driver, timeout).until(
                EC.presence_of_element_located((By.XPATH, selector))
            )
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element)
            time.sleep(2)  # Увеличенное время ожидания после прокрутки
            element.clear()
            element.send_keys(keys)
            return element
        except Exception as e:
            print(f"Не удалось ввести текст в элемент с селектором: {selector}")
            print(f"Текущий URL: {driver.current_url}")
            print("Доступные элементы:")
            print(driver.find_elements(By.XPATH, "//*[@type='text' or @type='search']"))
            raise e

    def test_full_flow(self, driver):
        try:
            # 1. Регистрация
            print("Тестирование регистрации...")
            print(f"Используется тестовый аккаунт: {TEST_EMAIL}")
            driver.get("http://localhost:3000/register")
            time.sleep(2)
            driver.find_element(By.XPATH, "/html/body/main/div/div/div[2]/div/div/form/div[1]/div[1]/input").send_keys("test")
            self.wait_and_send_keys(driver, SELECTORS['email_input'], TEST_EMAIL)
            self.wait_and_send_keys(driver, SELECTORS['password_input'], TEST_PASSWORD)
            driver.find_element(By.XPATH, "/html/body/main/div/div/div[2]/div/div/form/div[1]/div[4]/input").send_keys(TEST_PASSWORD)
            time.sleep(1)
            driver.find_element(By.XPATH, "/html/body/main/div/div/div[2]/div/div/form/div[2]/button").click()
            
            time.sleep(3)  
            
    
            # На главную страницу
            driver.get("http://localhost:3000")
            time.sleep(3)
            
            # 2. Поиск товаров
            print("Тестирование поиска...")
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "/html/body/div/main/div/div/div/div/div[1]/div[1]/input"))
            )
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div/div[1]/div[1]/input").send_keys("Ноутбук ASUS ROG Strix G15")
            time.sleep(3)
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "/html/body/div/main/div/div/div/div/div[1]/div[1]/div"))
            )
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div/div[1]/div[1]/div").click()
            time.sleep(3)
            
            # 3. Добавление в корзину
            print("Тестирование добавления в корзину...")
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "/html/body/div/main/div/div/div/div/div[4]/div/div/div[2]/div[1]/a"))
            )
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div/div[4]/div/div/div[2]/div[1]/a").click()
            time.sleep(2)
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "body > div > main > div > div > div > div.flex.flex-col.justify-between > div > div.my-6 > div > div > button"))
            )
            driver.find_element(By.CSS_SELECTOR, "body > div > main > div > div > div > div.flex.flex-col.justify-between > div > div.my-6 > div > div > button").click()
            time.sleep(2)


            # 2.1
            driver.get("http://localhost:3000")
            time.sleep(2)
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div/div[1]/div[1]/input").send_keys("Видеокарта NVIDIA GeForce RTX 3080")
            time.sleep(3)
            
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div/div[1]/div[1]/div").click()
            time.sleep(3)
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div/div[4]/div/div/div[2]/div[1]/a").click()
            time.sleep(2)
            driver.find_element(By.CSS_SELECTOR, "body > div > main > div > div > div > div.flex.flex-col.justify-between > div > div.my-6 > div > div > button").click()
            time.sleep(2)
            
            # 4. Добавление в избранное
            print("Тестирование избранного...")
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div[2]/div/div[1]/button").click()
            time.sleep(2)
            
            # 5. Проверка корзины
            print("Тестирование корзины...")
            driver.find_element(By.XPATH, "/html/body/div/nav/div/div/div[2]/div[2]/a").click()
            time.sleep(3)
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "/html/body/div/main/div/div/div/div[2]/div[4]/div/button"))
            )
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div[2]/div[4]/div/button").click()
            time.sleep(2)

            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "/html/body/div/main/div/div/div/div[4]/div[2]/div[2]/button"))
            )
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div[4]/div[2]/div[2]/button").click()
            
            time.sleep(3)

            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "/html/body/div/main/div/div/div/div[1]/form/div[1]/input"))
            )
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div[1]/form/div[1]/input").clear()
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div[1]/form/div[1]/input").send_keys("Test Test Test")
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div[1]/form/div[2]/input").clear()
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div[1]/form/div[2]/input").send_keys(TEST_EMAIL)
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div[1]/form/div[3]/input").clear()
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div[1]/form/div[3]/input").send_keys(TEST_PHONE)
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div[1]/form/div[4]/textarea").clear()
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div[1]/form/div[4]/textarea").send_keys("Test Address")
            time.sleep(3)
            driver.find_element(By.XPATH, "/html/body/div/main/div/div/div/div[1]/form/div[5]/div/button").click()
            time.sleep(5)
            

            #5.5 Проверка избранного
            print("Тестирование избранного...")
            driver.get("http://localhost:3000/dashboard")
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "/html/body/div/nav/div/div/div[2]/div[1]/a"))
            )
            driver.find_element(By.XPATH, "/html/body/div/nav/div/div/div[2]/div[1]/a").click()
            time.sleep(5)
            
            # 6. Check dashboard
            print("Тестирование личного кабинета...")
            driver.get("http://localhost:3000/dashboard")
            time.sleep(3)
            driver.find_element(By.XPATH, "/html/body/div/main/div/div[1]/div/div/div/div/div/button").click()
            time.sleep(1)
            driver.find_element(By.XPATH,"/html/body/div/main/div/div[1]/div/div/div/div/form/div/input").send_keys(TEST_PHONE)
            time.sleep(1)            
            driver.find_element(By.XPATH, "/html/body/div/main/div/div[1]/div/div/div/div/form/div/button").click()
            time.sleep(1)

            
            driver.find_element(By.XPATH, "/html/body/div/main/div/div[1]/div/div/div/p[2]/button").click()
            time.sleep(2)
            self.wait_for_redirects(driver)
            time.sleep(2)
                            
            # Проверка где мы
            time.sleep(2)
            current_url = driver.current_url
            if "login" in current_url:
                time.sleep(2)
                self.wait_and_send_keys(driver, SELECTORS['email_input'], TEST_EMAIL)
                self.wait_and_send_keys(driver, SELECTORS['password_input'], TEST_PASSWORD)
                time.sleep(1)
                driver.find_element(By.XPATH, "/html/body/main/div/div/div[2]/div/div/form/div[2]/button").click()
                time.sleep(3)
                self.wait_for_redirects(driver) 
            time.sleep(2)
            

            print("Все тесты успешно завершены!")
            
        except Exception as e:
            print(f"Тест не пройден: {str(e)}")
            raise