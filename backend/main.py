from flask import Flask, render_template, request, jsonify, send_from_directory
import google.generativeai as genai
import os
from dotenv import load_dotenv
import logging
from flask_cors import CORS
import mimetypes

load_dotenv()

mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
app = Flask(__name__, static_folder='dist', static_url_path='', template_folder='dist')
logging.basicConfig(level=logging.DEBUG)
genai.configure(api_key=os.getenv("API_KEY"))
#CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])
CORS(app, resources={r"/analyze": {"origins": "http://localhost:5173"}})

@app.route('/')
def serve_index():
    return render_template('index.html')


@app.route('/assets/<path:path>')
def serve_assets(path):
    return send_from_directory(os.path.join(app.static_folder, 'assets'), path)

# Serve other static files
@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return render_template('index.html')


@app.route("/analyze", methods=["POST"])
def analyze():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    image = request.files['image']

    # Check file extension
    allowed_extensions = {'jpg', 'jpeg', 'png', 'gif'}
    file_extension = image.filename.rsplit('.', 1)[1].lower() if '.' in image.filename else ''
    if file_extension not in allowed_extensions:
        error_message = f"Unsupported file type. Allowed types are: {', '.join(allowed_extensions)}"
        return jsonify({"error": error_message}), 400
    
    temp_path = "temp_image." + file_extension
    image.save(temp_path)
    app.logger.info(f"Saved image to {temp_path}")
    
    try:
        analysis_result = analyze_image(temp_path)
        return jsonify({"analysis": analysis_result})
    except Exception as e:
        app.logger.error(f"Error during analysis: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up the temporary file
        os.remove(temp_path)

def analyze_image(image_path):
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    try:
        with open(image_path, 'rb') as img_file:
            image_data = img_file.read()
        
        image_parts = [{"mime_type": "image/jpeg", "data": image_data}]
        prompt_parts = [
            "Analyze this image. What plant is shown? Does it have any pest infestation or disease? If yes, what disease? Provide detailed information about the plant's condition."
        ]
        
        response = model.generate_content(image_parts + prompt_parts)
        return response.text
    except Exception as e:
        app.logger.error(f"Error in analyze_image: {str(e)}", exc_info=True)
        raise

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=os.environ.get('PORT', 5000))

