import random

# Proxy list provided by user (IP:PORT:USER:PASS)
PROXIES = [
    "31.59.20.176:6754:avxqjufm:rtlnw3wg2dtz",
    "198.23.239.134:6540:avxqjufm:rtlnw3wg2dtz",
    "31.56.127.193:7684:avxqjufm:rtlnw3wg2dtz",
    "45.38.107.97:6014:avxqjufm:rtlnw3wg2dtz",
    "107.172.163.27:6543:avxqjufm:rtlnw3wg2dtz",
    "216.10.27.159:6837:avxqjufm:rtlnw3wg2dtz",
    "142.111.67.146:5611:avxqjufm:rtlnw3wg2dtz",
    "191.96.254.138:6185:avxqjufm:rtlnw3wg2dtz",
    "31.58.9.4:6077:avxqjufm:rtlnw3wg2dtz",
    "23.229.19.94:8689:avxqjufm:rtlnw3wg2dtz",
]

def get_random_proxy_url():
    """Return a random proxy URL in http://user:pass@host:port format."""
    proxy = random.choice(PROXIES)
    ip, port, user, password = proxy.split(':')
    return f"http://{user}:{password}@{ip}:{port}"

def get_proxy_dict():
    """Return proxy dict for libraries like youtube-transcript-api."""
    url = get_random_proxy_url()
    return {"http": url, "https": url}
