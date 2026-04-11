import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

replacements = [
    ("para negocios hispanos en Estados Unidos", "para emprendedores y negocios en Estados Unidos"),
    ("a negocios hispanos en Estados Unidos a competir", "a emprendedores y negocios en Estados Unidos a competir"),
    ("la cultura hispana", "las necesidades del mercado multicultural"),
    ("tu negocio hispano en Estados Unidos", "tu negocio en Estados Unidos"),
    ("para negocios hispanos en USA", "para emprendedores en USA"),
    
    ("for Hispanic businesses in the United States", "for entrepreneurs and businesses in the United States"),
    ("help Hispanic businesses in the United States compete", "help entrepreneurs and businesses in the United States compete"),
    ("of Hispanic culture", "of the multicultural and bilingual market"),
    ("your Hispanic business in the United States", "your business in the United States"),
    ("for Hispanic businesses in the US", "for visionary businesses in the US")
]

for old, new in replacements:
    text = text.replace(old, new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Copy updated successfully.")
