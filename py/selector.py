# selector.py
import sys
import pyodbc
import datetime

driver = '{ODBC Driver 13 for SQL Server}'

def return_matched_dict(cursor, row):
    return_dict = {}
    for column_name, row_data in zip(cursor.description, row):
        if type(row_data) is datetime.datetime:
            row_data = str(row_data)
        elif row_data is None:
            row_data = ''
        return_dict[column_name[0]] = row_data
    return return_dict

def execute_select_sql(sql, config):
    cnxn = pyodbc\
        .connect('DRIVER={driver};PORT=1433;SERVER={server};PORT=1433;DATABASE={database};UID={username};PWD={password}'
                 .format(driver=driver, server=config['server'], database=config['database'], username=config['username'], password=config['password']))
    cursor = cnxn.cursor()
    cursor.execute(sql)
    rows = []
    row = cursor.fetchone()
    while row:
        rows.append(return_matched_dict(cursor, row))
        row = cursor.fetchone()
    cnxn.close()
    return rows

config = {
    'server': sys.argv[1],
    'database': sys.argv[2],
    'username': sys.argv[3],
    'password': sys.argv[4]
}

result = execute_select_sql(sys.argv[5], config)
print(str(result).replace('\'', '"'))