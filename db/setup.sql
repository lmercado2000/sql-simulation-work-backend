CREATE TABLE IF NOT EXISTS Student_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Students (
    id SERIAL PRIMARY KEY,
    status_id INT NOT NULL REFERENCES Student_status(id),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    sex BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Teachers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    sex BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Grades (
    id SERIAL PRIMARY KEY,
    grade INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Classes (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    teacher_id INT NOT NULL REFERENCES Teachers(id),
    grade_id INT NOT NULL REFERENCES Grades(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- junction table
CREATE TABLE IF NOT EXISTS Class_students (
    student_id INT NOT NULL REFERENCES Students(id),
    class_id INT NOT NULL REFERENCES Classes(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, class_id)
);

-- junction table
CREATE TABLE IF NOT EXISTS Student_exams (
    student_id INT NOT NULL REFERENCES Students(id),
    class_id INT NOT NULL REFERENCES Classes(id),
    grade_rating INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, class_id)
);

CREATE TABLE IF NOT EXISTS Subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- junction table
CREATE TABLE IF NOT EXISTS Grades_subjects (
    grade_id INT NOT NULL REFERENCES Grades(id),
    subject_id INT NOT NULL REFERENCES Subjects(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (grade_id, subject_id)
);

CREATE TABLE IF NOT EXISTS Schedule (
    id SERIAL PRIMARY KEY,
    weekday VARCHAR(255) NOT NULL CHECK (
        weekday IN (
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri'
        )
    ),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- junction table
CREATE TABLE IF NOT EXISTS Daily_subjects (
    schedule_id INT NOT NULL REFERENCES Schedule(id),
    subject_id INT NOT NULL REFERENCES Subjects(id),
    order_index INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (schedule_id, subject_id)
);

-- junction table
CREATE TABLE IF NOT EXISTS Grades_schedules (
    grade_id INT NOT NULL REFERENCES Grades(id),
    schedule_id INT NOT NULL REFERENCES Schedule(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (grade_id, schedule_id)
)