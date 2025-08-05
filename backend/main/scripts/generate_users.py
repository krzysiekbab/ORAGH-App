import csv
import unicodedata
import os

CSV_PATH = "/Users/krzysztofbabicki/Documents/Programowanie Projekty/ORAGH-App/oragh_platform/data/oragh_musicians.csv"

def remove_polish_letters(text):
    # Remove accents and special characters
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    return text

def generate_username(first_name, last_name):
    first = remove_polish_letters(first_name.strip().lower())
    last = remove_polish_letters(last_name.strip().lower())
    return f"{first}.{last}"

def generate_email(first_name, last_name):
    first = remove_polish_letters(first_name.strip().lower())
    last = remove_polish_letters(last_name.strip().lower())
    return f"{first}.{last}@gmail.com"

def main():
    # Read all rows
    with open(CSV_PATH, newline='', encoding='utf-8') as csvfile:
        rows = list(csv.DictReader(csvfile))
        fieldnames = rows[0].keys()

    # Update rows
    for row in rows:
        if not row['username']:
            row['username'] = generate_username(row['first_name'], row['last_name'])
        if not row['email']:
            row['email'] = generate_email(row['first_name'], row['last_name'])

    # Write back to CSV
    with open(CSV_PATH, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

if __name__ == "__main__":
    main()
