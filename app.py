from flask import Flask, render_template
from flask.ext.triangle import Triangle
from flask import jsonify
from flask import request
import nltk
from nltk.corpus import cmudict
import re
import json

SYLLABLES = cmudict.dict()
REG = re.compile(r'([A-za-z]*)(\d*)')

app = Flask(__name__, static_folder="public", template_folder="views")
Triangle(app)


def getMeterRhyme(words):
    syl = []
    for word in words:
        temp_dict = {}
        temp_dict['word'] = word
        temp_syl = SYLLABLES[word][0]
        phonemes = [{'phoneme':s[0], 'stress':int(s[1] or -1)} for s in [re.findall(REG,syl_grp)[0] for syl_grp in temp_syl] ]
        temp_dict['phonemes'] = phonemes
        syl.append(temp_dict)
    return syl

# routes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/getSyllables')
def getSyllables():
    words = request.args.getlist('words')
    words = [word.lower() for word in words]
    words = getMeterRhyme(words)
    # print words
    # result = jsonify(words)
    result = json.dumps(words)
    # print result
    return result

if __name__ == '__main__':
    app.run()