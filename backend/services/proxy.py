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
    "31.59.20.176:6754:ehxgmyde:vrsbs23x2e4e",
    "198.23.239.134:6540:ehxgmyde:vrsbs23x2e4e",
    "31.56.127.193:7684:ehxgmyde:vrsbs23x2e4e",
    "45.38.107.97:6014:ehxgmyde:vrsbs23x2e4e",
    "107.172.163.27:6543:ehxgmyde:vrsbs23x2e4e",
    "216.10.27.159:6837:ehxgmyde:vrsbs23x2e4e",
    "142.111.67.146:5611:ehxgmyde:vrsbs23x2e4e",
    "191.96.254.138:6185:ehxgmyde:vrsbs23x2e4e",
    "31.58.9.4:6077:ehxgmyde:vrsbs23x2e4e",
    "23.229.19.94:8689:ehxgmyde:vrsbs23x2e4e",
    "31.59.20.176:6754:pvuivsje:lphk6c4a12k0",
    "198.23.239.134:6540:pvuivsje:lphk6c4a12k0",
    "31.56.127.193:7684:pvuivsje:lphk6c4a12k0",
    "45.38.107.97:6014:pvuivsje:lphk6c4a12k0",
    "107.172.163.27:6543:pvuivsje:lphk6c4a12k0",
    "216.10.27.159:6837:pvuivsje:lphk6c4a12k0",
    "142.111.67.146:5611:pvuivsje:lphk6c4a12k0",
    "191.96.254.138:6185:pvuivsje:lphk6c4a12k0",
    "31.58.9.4:6077:pvuivsje:lphk6c4a12k0",
    "23.229.19.94:8689:pvuivsje:lphk6c4a12k0",
    "31.59.20.176:6754:ideslndh:rf282f21k9t4",
    "198.23.239.134:6540:ideslndh:rf282f21k9t4",
    "31.56.127.193:7684:ideslndh:rf282f21k9t4",
    "45.38.107.97:6014:ideslndh:rf282f21k9t4",
    "107.172.163.27:6543:ideslndh:rf282f21k9t4",
    "216.10.27.159:6837:ideslndh:rf282f21k9t4",
    "142.111.67.146:5611:ideslndh:rf282f21k9t4",
    "191.96.254.138:6185:ideslndh:rf282f21k9t4",
    "31.58.9.4:6077:ideslndh:rf282f21k9t4",
    "23.229.19.94:8689:ideslndh:rf282f21k9t4",
    "31.59.20.176:6754:dnkaccgg:qu17jmiuq12p",
    "198.23.239.134:6540:dnkaccgg:qu17jmiuq12p",
    "31.56.127.193:7684:dnkaccgg:qu17jmiuq12p",
    "45.38.107.97:6014:dnkaccgg:qu17jmiuq12p",
    "107.172.163.27:6543:dnkaccgg:qu17jmiuq12p",
    "216.10.27.159:6837:dnkaccgg:qu17jmiuq12p",
    "142.111.67.146:5611:dnkaccgg:qu17jmiuq12p",
    "191.96.254.138:6185:dnkaccgg:qu17jmiuq12p",
    "31.58.9.4:6077:dnkaccgg:qu17jmiuq12p",
    "23.229.19.94:8689:dnkaccgg:qu17jmiuq12p",
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
