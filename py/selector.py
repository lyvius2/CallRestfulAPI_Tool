# selector.py
import sys
import abc
import json
import datetime

class Selector:
    __metaclass__ = abc.ABCMeta

    def __init__(self, config):
        self.config = config

    @staticmethod
    def return_matched_dict(cursor, row):
        return_dict = {}
        for column_name, row_data in zip(cursor.description, row):
            if type(row_data) is datetime.datetime:
                row_data = str(row_data)
            elif row_data is None:
                row_data = ''
            return_dict[column_name[0]] = row_data
        return return_dict

    @abc.abstractmethod
    def __return_connector_object__(self):
        pass

    def execute_select_sql(self, sql):
        rows = []
        try:
            conn = self.__return_connector_object__()
            cursor = conn.cursor()
            cursor.execute(sql)
            row = cursor.fetchone()
            while row:
                rows.append(self.return_matched_dict(cursor, row))
                row = cursor.fetchone()
        except Exception as e:
            rows = e
        finally:
            cursor.close()
            conn.close()
        return rows


class SelectorMsSql(Selector):

    def __return_connector_object__(self):
        import pyodbc
        driver = '{ODBC Driver 13 for SQL Server}'
        conn_string = 'DRIVER={driver};PORT=1433;SERVER={server};PORT=1433;DATABASE={database};charset=utf8;UID={username};PWD={password}'\
            .format(driver=driver, server=self.config['server'], database=self.config['database'], username=self.config['username'], password=self.config['password'])
        return pyodbc.connect(conn_string, unicode_results=True)


class SelectorPgSql(Selector):

    def __return_connector_object__(self):
        import psycopg2
        conn_string = 'host=\'{server}\' dbname=\'{database}\' user=\'{username}\' password=\'{password}\''\
            .format(server=self.config['server'], database=self.config['database'], username=self.config['username'], password=self.config['password'])
        return psycopg2.connect(conn_string)


config = {
    'server': sys.argv[1],
    'database': sys.argv[2],
    'username': sys.argv[3],
    'password': sys.argv[4]
}

'''
_m = getattr(__import__(sys.argv[6], fromlist=[]), sys.argv[6])(config)
'''

_m = eval(sys.argv[6])(config)
query_result = _m.execute_select_sql(sys.argv[5])
print(ascii(json.dumps(query_result)))
