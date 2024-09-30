install:
	pip3 install -r requirements.txt

run:
	python3 -m flask run --port=3000
	python3 app.py