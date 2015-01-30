from flask import Flask, render_template
from flask.ext.triangle import Triangle
from flask import jsonify
from flask import request
import nltk
from nltk.corpus import cmudict

SYLLABLES = cmudict.dict()

app = Flask(__name__, static_folder="public", template_folder="views")
Triangle(app)


def getMeterRhyme(words):
    return words

# routes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/getSyllables')
def getSyllables():
    words = request.args.getlist('words')
    words = [word.lower() for word in words]
    words = getMeterRhyme(words)
    print words
    result = {"something":10}
    return jsonify(result)

if __name__ == '__main__':
    app.run()