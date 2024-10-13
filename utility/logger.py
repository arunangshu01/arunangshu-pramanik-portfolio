import logging


class Logger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s :: %(name)s :: %(levelname)s :: %(message)s')
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)

    def info(self, message: str):
        self.logger.info(message)

    def warning(self, message: str):
        self.logger.warning(message)

    def error(self, message: str):
        self.logger.error(message)

    def debug(self, message: str):
        self.logger.debug(message)
