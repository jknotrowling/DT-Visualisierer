import math

def gray_code(bits):
    if bits == 0:
        return [""]
    prev = gray_code(bits - 1)
    return ['0' + code for code in prev] + ['1' + code for code in reversed(prev)]

def generate_gray_matrix(n):
    a = math.ceil(n / 2)
    b = math.floor(n / 2)

    gray_a = gray_code(a)
    gray_b = gray_code(b)

    matrix = []
    for code_a in gray_a:
        row = []
        for code_b in gray_b:
            full_code = code_a + code_b
            row.append([int(bit) for bit in full_code])
        matrix.append(row)
    return matrix

def print_gray_matrix(matrix):
    print(f"Matrixgröße: {len(matrix)} x {len(matrix[0])}")
    for row in matrix:
        for code in row:
            print(code, end=" ")
        print()

def main():
    n = int(input("Gib die Anzahl der Bits n ein: "))
    matrix = generate_gray_matrix(n)
    print_gray_matrix(matrix)

if __name__ == "__main__":
    main()


def map_decimal_to_symmetry_diagram_field(decimal_index, number_of_variables):
    matrix = generate_gray_matrix(number_of_variables)
    
    for i, row in enumerate(matrix):
        for j, code in enumerate(row):
            if int(''.join(map(str, code)), 2) == decimal_index:
                return [i,j]