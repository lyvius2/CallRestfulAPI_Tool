## Restful API Tool

DB 데이터를 SELECT하는 SQL문을 입력받아 실행 후 결과 ROW 데이터를 가지고  
RESTFUL API를 호출하는 간단한 작업용 툴

### Tech

* [node.js] - evented I/O for the backend
* [electron] - build cross platform desktop apps
* [python] - programming language

### Structure

![Alt text](https://res.cloudinary.com/dsjh3mlnz/image/upload/c_scale,w_760/v1492401517/RestfulAPI_Tool_wfiimy.jpg "electron + python")

기본 Electron App의 구조에 Main Process에서 Python 스크립트를 실행하는 형태로 되어 있습니다.  
Electron이 Node.js 기반의 플랫폼이니만큼, 당연히 NPM으로 관리하는 JS 라이브러리를 사용하는 것이 더 합리적인 구조인데... Python을 공부한 겸에 까먹지 않고 어떻게든 활용해보려고 하다 이런 괴악한 구조(?)를 갖게 되었습니다. 실제 테스트해 본 결과... 당연히 Python 스크립트보다 Node 모듈을 이용해 구현한 것이 작업속도가 더 빨랐습니다.  
SQL 쿼리를 실행하는 것은 Python 스크립트로 수행하고 HTTP API 호출을 하는 부분은 Node 모듈을 사용할 지 Python 스크립트를 사용할 지 선택할 수 있게끔 하였습니다.

### Installation

Python 3, Node.js 6.9 이상 버전 설치 후 프로젝트 루트 디렉터리에서,

<pre><code>npm install</code></pre>

Node 모듈 설치가 완료되고 나서 package.json에 정의된 스크립트 실행

<pre><code>npm start</code></pre>

또는 일반적인 Electron App 실행방법으로도 구동됩니다.

<pre><code>electron .</code></pre>

![Alt_text](https://res.cloudinary.com/dsjh3mlnz/image/upload/c_scale,w_550/v1492403710/start01_bmg3af.png "실행 후 첫 화면")

### Build

* 실행파일로 빌드하기

<pre><code>npm install electron-packager -g
npm build</code></pre>

* 인스톨러 생성

<pre><code>npm install electron-installer-windows -g
npm setup</code></pre>

### How to use

![Alt_text](https://res.cloudinary.com/dsjh3mlnz/image/upload/c_scale,w_550/v1492404963/start01_b9bcad.png "SQL 입력")

1. DB 접속 정보 입력
2. Select SQL Query 입력
3. Action! 버튼 클릭하여 Query 실행

![Alt_text](https://res.cloudinary.com/dsjh3mlnz/image/upload/c_scale,w_550/v1492404965/start02_qfffcn.png "SQL 실행 후 화면")

4. API 호출하는데 사용할 모듈 선택 (Node.js, Python)
5. HTTP 메서드 선택 (GET, POST)
6. 파라메터 항목 명과 파라메터로 전송할 Column 체크
7. HTTP API 호출
8. 호출 후 결과 표시

### Library

* jquery - Indicator 구현
* async - Callback Hell 처리
* electron-json-storage - Renderer Process에서 설정 정보를 Local Storage에 저장
* python-shell - Node.js에서 Python 스크립트를 실행할 수 있게 함
* request - HTTP 프로토콜 요청
* vue.js - SQL SELECT 결과값 렌더링 
* pyodbc - MS SQL Server ODBC 드라이버를 사용 (in Python)
* psycopg2 - PostgreSQL DB 드라이버 (in Python)
* requests - HTTP 프로토콜 요청 (in Python) 
* Microsoft ODBC 드라이버 13.1 : https://www.microsoft.com/en-us/download/details.aspx?id=53339


[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [node.js]: <http://nodejs.org>
   [electron]: <https://electron.atom.io>
   [python]: <https://www.python.org>
